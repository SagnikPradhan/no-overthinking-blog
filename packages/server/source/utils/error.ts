interface ErrorContext {
  isOperational: boolean;
  [key: string]: unknown;
}

/**
 * App Error
 */
export class AppError extends Error {
  public readonly context: ErrorContext;

  /**
   * Create a new App Error
   * @param name - Error name
   * @param context - Error context
   * @param context.isOperational - Is app functional after the error
   * @param context.key - Additional context properties
   */
  constructor(name: string, context: ErrorContext) {
    super(name);

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = name;
    this.context = context;

    Error.captureStackTrace(this);
  }
}

/**
 * Handle Errors
 * @param error - Emitted Error
 */
export function handleError(error: Error) {
  console.error(error);

  if (error instanceof AppError && error.context.isOperational) return;
  else process.exit(1);
}
