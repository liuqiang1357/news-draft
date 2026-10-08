import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { FastifyReply } from "fastify";
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    return reply.status(status).send({
      error: {
        code:
          status === 503
            ? "SERVICE_UNAVAILABLE"
            : status >= 500
              ? "INTERNAL_ERROR"
              : "REQUEST_REJECTED",
        message:
          status >= 500 ? "The request could not be completed." : "The request was rejected.",
      },
    });
  }
}
