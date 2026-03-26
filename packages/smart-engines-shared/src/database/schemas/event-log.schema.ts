import mongoose, { Schema, Document } from 'mongoose';

/**
 * Event Log Document Interface
 */
export interface EventLogDocument extends Document {
  eventId: string;
  eventType: string;
  source: string;
  data: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Event Log MongoDB Schema (for event sourcing)
 */
export const EventLogSchema = new Schema<EventLogDocument>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    source: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    timestamp: { type: Date, required: true, index: true },
    processed: { type: Boolean, default: false, index: true },
    processedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'event_logs',
  }
);

// Index for unprocessed events
EventLogSchema.index(
  { processed: 1, timestamp: 1 },
  {
    partialFilterExpression: { processed: false },
  }
);

export const EventLogModel = mongoose.model<EventLogDocument>('EventLog', EventLogSchema);
