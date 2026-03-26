import {
  isError,
  isString,
  isNumber,
  isObject,
  isArray,
  isNullish,
  isDefined,
  getErrorMessage,
  getErrorStack,
  toError,
  assertDefined,
  assert,
} from './type-guards';

describe('Type Guards', () => {
  describe('isError', () => {
    it('should return true for Error instances', () => {
      expect(isError(new Error('test'))).toBe(true);
      expect(isError(new TypeError('test'))).toBe(true);
      expect(isError(new RangeError('test'))).toBe(true);
    });

    it('should return false for non-Error values', () => {
      expect(isError('error string')).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError(undefined)).toBe(false);
      expect(isError({ message: 'fake error' })).toBe(false);
      expect(isError(123)).toBe(false);
    });
  });

  describe('isString', () => {
    it('should return true for strings', () => {
      expect(isString('')).toBe(true);
      expect(isString('hello')).toBe(true);
      expect(isString(String('test'))).toBe(true);
    });

    it('should return false for non-strings', () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-456)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(Infinity)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isNumber('123')).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should return true for plain objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should return false for null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isObject([])).toBe(false);
      expect(isObject([1, 2, 3])).toBe(false);
    });

    it('should return false for primitives', () => {
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
      expect(isObject(undefined)).toBe(false);
    });
  });

  describe('isArray', () => {
    it('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
    });

    it('should return false for non-arrays', () => {
      expect(isArray({})).toBe(false);
      expect(isArray('string')).toBe(false);
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
    });
  });

  describe('isNullish', () => {
    it('should return true for null and undefined', () => {
      expect(isNullish(null)).toBe(true);
      expect(isNullish(undefined)).toBe(true);
    });

    it('should return false for other values', () => {
      expect(isNullish(0)).toBe(false);
      expect(isNullish('')).toBe(false);
      expect(isNullish(false)).toBe(false);
      expect(isNullish({})).toBe(false);
    });
  });

  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined(0)).toBe(true);
      expect(isDefined('')).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('should return false for null and undefined', () => {
      expect(isDefined(null)).toBe(false);
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error', () => {
      expect(getErrorMessage(new Error('test error'))).toBe('test error');
    });

    it('should return string as-is', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should extract message from object with message property', () => {
      expect(getErrorMessage({ message: 'object error' })).toBe('object error');
    });

    it('should return default message for unknown types', () => {
      expect(getErrorMessage(123)).toBe('Unknown error');
      expect(getErrorMessage(null)).toBe('Unknown error');
      expect(getErrorMessage(undefined)).toBe('Unknown error');
    });

    it('should allow custom default message', () => {
      expect(getErrorMessage(123, 'Custom default')).toBe('Custom default');
    });

    it('should handle objects without string message', () => {
      expect(getErrorMessage({ message: 123 })).toBe('Unknown error');
    });
  });

  describe('getErrorStack', () => {
    it('should extract stack from Error', () => {
      const error = new Error('test');
      expect(getErrorStack(error)).toBeDefined();
      expect(getErrorStack(error)).toContain('Error: test');
    });

    it('should return undefined for non-Error values', () => {
      expect(getErrorStack('string')).toBeUndefined();
      expect(getErrorStack(null)).toBeUndefined();
      expect(getErrorStack({ stack: 'fake' })).toBeUndefined();
    });
  });

  describe('toError', () => {
    it('should return same Error if already Error', () => {
      const error = new Error('test');
      expect(toError(error)).toBe(error);
    });

    it('should convert string to Error', () => {
      const result = toError('string error');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('string error');
    });

    it('should convert object with message to Error', () => {
      const result = toError({ message: 'object error' });
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('object error');
    });

    it('should convert unknown to Error with default message', () => {
      const result = toError(123);
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Unknown error');
    });
  });

  describe('assertDefined', () => {
    it('should not throw for defined values', () => {
      expect(() => assertDefined(0)).not.toThrow();
      expect(() => assertDefined('')).not.toThrow();
      expect(() => assertDefined(false)).not.toThrow();
      expect(() => assertDefined({})).not.toThrow();
    });

    it('should throw for null', () => {
      expect(() => assertDefined(null)).toThrow('Value is null or undefined');
    });

    it('should throw for undefined', () => {
      expect(() => assertDefined(undefined)).toThrow('Value is null or undefined');
    });

    it('should use custom message', () => {
      expect(() => assertDefined(null, 'Custom message')).toThrow('Custom message');
    });
  });

  describe('assert', () => {
    it('should not throw for true condition', () => {
      expect(() => assert(true)).not.toThrow();
      expect(() => assert(1 === 1)).not.toThrow();
    });

    it('should throw for false condition', () => {
      expect(() => assert(false)).toThrow('Assertion failed');
    });

    it('should use custom message', () => {
      expect(() => assert(false, 'Custom assertion')).toThrow('Custom assertion');
    });
  });
});
