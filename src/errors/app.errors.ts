export class AppError extends Error {
   public readonly statusCode: number;
   public readonly message: string;

   constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
      this.message = message;

      Object.setPrototypeOf(this, new.target.prototype);
      Error.captureStackTrace(this);
   }
}
