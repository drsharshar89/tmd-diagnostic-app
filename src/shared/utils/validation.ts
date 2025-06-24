// Validation Utilities - FSD Shared Layer
// Functions for data validation and error handling

/**
 * Creates a standardized application error object
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional error details
 * @returns Error object
 */
export const createAppError = (
  code: string,
  message: string,
  details?: Record<string, unknown>
) => ({
  code,
  message,
  details,
  timestamp: new Date(),
});

/**
 * Validates basic input requirements
 * @param value - Value to validate
 * @param required - Whether the field is required
 * @param minLength - Minimum length requirement
 * @returns Validation result
 */
export const validateInput = (
  value: string | unknown,
  required: boolean = false,
  minLength: number = 0
): { isValid: boolean; error?: string } => {
  if (required && (!value || (typeof value === 'string' && value.trim().length === 0))) {
    return { isValid: false, error: 'This field is required' };
  }

  if (typeof value === 'string' && value.length < minLength) {
    return { isValid: false, error: `Minimum length is ${minLength} characters` };
  }

  return { isValid: true };
};
