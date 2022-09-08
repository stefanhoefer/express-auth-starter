export class AppError extends Error {
  public errorType: string;
  public httpStatusCode: number;
  public instance: string | undefined;
  public readonly apiError?: Error | unknown;
  public clientResponse?: ErrorClientResponse | undefined;

  constructor(type: string, message: string, httpStatusCode: number, apiError?: Error | unknown) {
    super(message);
    this.errorType = type;
    this.httpStatusCode = httpStatusCode;
    this.apiError = apiError;
    // 👇️ because a built-in class is extended
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ErrorClientResponse {
  type: string;
  httpStatusCode: number;
  message: string;
  instance: string | undefined;

  constructor(type: string, httpStatusCode: number, message: string, instance?: string) {
    this.type = type;
    this.httpStatusCode = httpStatusCode;
    this.message = message;
    this.instance = instance;
  }
}

export const createFallbackResponse = () => {
  new ErrorClientResponse('/errors/server/unknown-server-error', 500, 'An unknown error occurred');
};
