/**
 * TrustState middleware for Express and Next.js.
 *
 * @example Express
 * ```typescript
 * import express from "express";
 * import { TrustStateClient, trustStateMiddleware } from "@truststate/sdk";
 *
 * const app = express();
 * const client = new TrustStateClient({ apiKey: "your-key" });
 * app.use(express.json());
 * app.use(trustStateMiddleware(client));
 * ```
 *
 * @example Next.js API route
 * ```typescript
 * import { withCompliance } from "@truststate/sdk";
 * import { client } from "@/lib/truststate";
 *
 * export default withCompliance(client, "AgentResponse", async (req, res) => {
 *   res.json({ message: "Compliant response" });
 * });
 * ```
 */

import { TrustStateClient } from "./client.js";

// ---------------------------------------------------------------------------
// Express types (kept minimal to avoid adding @types/express as a dependency)
// ---------------------------------------------------------------------------

interface ExpressRequest {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

interface ExpressResponse {
  status(code: number): ExpressResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

type NextFunction = (err?: unknown) => void;
type RequestHandler = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: NextFunction
) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Next.js types (minimal)
// ---------------------------------------------------------------------------

interface NextApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}

interface NextApiResponse {
  status(code: number): NextApiResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Express middleware options
// ---------------------------------------------------------------------------

export interface TrustStateMiddlewareOptions {
  /**
   * Default entity type to use when X-Compliance-Entity-Type header is absent.
   * If neither the header nor this option is set, the request passes through.
   */
  defaultEntityType?: string;
  /**
   * Default action to use when X-Compliance-Action header is absent.
   * @default "CREATE"
   */
  defaultAction?: string;
  /**
   * Header that carries a stable entity ID for this request.
   * @default "X-Compliance-Entity-Id"
   */
  entityIdHeader?: string;
}

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------

/**
 * Express middleware that gates requests on TrustState compliance.
 *
 * Reads X-Compliance-Entity-Type and X-Compliance-Action headers.
 * If X-Compliance-Entity-Type is present (or defaultEntityType is set),
 * the request body is submitted to TrustState before the request proceeds.
 *
 * Failed checks return HTTP 422. Passed checks attach X-Compliance-Record-Id
 * to the response headers.
 */
export function trustStateMiddleware(
  client: TrustStateClient,
  options: TrustStateMiddlewareOptions = {}
): RequestHandler {
  const {
    defaultEntityType,
    defaultAction = "CREATE",
    entityIdHeader = "X-Compliance-Entity-Id",
  } = options;

  return async function (
    req: ExpressRequest,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<void> {
    const entityType =
      (req.headers["x-compliance-entity-type"] as string | undefined) ??
      defaultEntityType;

    // Pass through if no entity type configured
    if (!entityType) {
      next();
      return;
    }

    const action =
      (req.headers["x-compliance-action"] as string | undefined) ?? defaultAction;
    const entityId = req.headers[entityIdHeader.toLowerCase()] as string | undefined;
    const data = (req.body as Record<string, unknown>) ?? {};

    try {
      const result = await client.check(entityType, data, {
        action,
        entityId: entityId ?? undefined,
      });

      if (!result.passed) {
        res.status(422).json({
          error: "Compliance check failed",
          failReason: result.failReason,
          failedStep: result.failedStep,
          entityId: result.entityId,
        });
        return;
      }

      // Attach record ID to response for downstream use
      if (result.recordId) {
        res.setHeader("X-Compliance-Record-Id", result.recordId);
      }

      next();
    } catch (err) {
      res.status(503).json({
        error: "Compliance service unavailable",
        detail: (err as Error).message,
      });
    }
  };
}

// ---------------------------------------------------------------------------
// Next.js route handler wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a Next.js API route handler with TrustState compliance checking.
 *
 * The request body is submitted to TrustState before the handler runs.
 * Returns 422 if the check fails.
 *
 * @param client - TrustStateClient instance.
 * @param entityType - The TrustState entity type to validate against.
 * @param handler - The Next.js route handler to wrap.
 * @param options - Optional action and entityIdHeader overrides.
 */
export function withCompliance(
  client: TrustStateClient,
  entityType: string,
  handler: NextApiHandler,
  options: {
    action?: string;
    entityIdHeader?: string;
  } = {}
): NextApiHandler {
  const { action = "CREATE", entityIdHeader = "x-compliance-entity-id" } = options;

  return async function (req: NextApiRequest, res: NextApiResponse): Promise<void> {
    const entityId = req.headers[entityIdHeader] as string | undefined;
    const data = (req.body as Record<string, unknown>) ?? {};

    try {
      const result = await client.check(entityType, data, {
        action,
        entityId: entityId ?? undefined,
      });

      if (!result.passed) {
        res.status(422).json({
          error: "Compliance check failed",
          failReason: result.failReason,
          failedStep: result.failedStep,
          entityId: result.entityId,
        });
        return;
      }

      if (result.recordId) {
        res.setHeader("X-Compliance-Record-Id", result.recordId);
      }

      await handler(req, res);
    } catch (err) {
      res.status(503).json({
        error: "Compliance service unavailable",
        detail: (err as Error).message,
      });
    }
  };
}
