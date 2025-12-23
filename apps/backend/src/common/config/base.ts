export enum ResponseCode {
  SUCCESS = 0,
  SERVER_ERROR = 500,
}

export interface ResponseTemplate<T> {
  code: ResponseCode;
  message: string;
  data: T;
  timestamp: number;
  errors?: Record<string, string[]>;
}
