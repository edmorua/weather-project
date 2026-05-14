import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	LoggerService
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

export interface ErrorResponseBody {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
  correlationId: string;
}


@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
	constructor(private readonly logger: LoggerService) {}

	private normalizeException(exception: unknown): { status: number; message: string; error: string } {
		if (exception instanceof HttpException) {
			const status = exception.getStatus();
			const response = exception.getResponse();
			const message = typeof response === 'string' ? response : (response as any).message || 'An error occurred';
			const error = exception.name;
			return { status, message, error };
		}

		return {
			status: HttpStatus.INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			error: 'InternalServerError',
		}

	}

	catch(exception: unknown, host: ArgumentsHost) {
		const context = host.switchToHttp();
		const response = context.getResponse<Response>();
		const request = context.getRequest<Request>();
		const correlationId = request.headers['x-correlation-id'] === undefined ? randomUUID() : String(request.headers['x-correlation-id']);
		const { status, message, error} = this.normalizeException(exception);

		const body: ErrorResponseBody = {
			statusCode: status,
			message,
			error,
			path: request.url,
			timestamp: new Date().toISOString(),
			correlationId,
		}

		if(status >= 500) {
			this.logger.error(`Correlation ID: ${correlationId} - ${message}`, (exception as any).stack);
		} else {
			this.logger.warn(
				{ msg: 'Handled exception', correlationId, path: request.url, status, message },
					CustomExceptionFilter.name,
			);		
		}
		response.setHeader('x-correlation-id', correlationId);
		response.status(status).json(body);
	}

}
