import { Response } from 'express';

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPage?: number;
}

interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: Meta;
  data: T;
}

export const sendResponse = <T>(res: Response, responseData: ApiResponse<T>): void => {
  res.status(responseData.statusCode).json({
    success: responseData.success,
    message: responseData.message,
    meta: responseData.meta,
    data: responseData.data,
  });
};
