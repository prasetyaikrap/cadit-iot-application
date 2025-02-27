import ClientError from "./ClientError";

export default class InvariantError extends ClientError {
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "InvariantError";
    this.statusCode = statusCode;
  }
}
