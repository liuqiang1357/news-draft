import { ReadinessService } from "@news-draft/backend";
import type { Health } from "@news-draft/contracts";
import { Controller, Get, Inject, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
@Controller("health")
export class HealthController {
  constructor(@Inject(ReadinessService) private readonly readiness: ReadinessService) {}
  @Get() check(): Health {
    return { service: "news-draft-api", status: "ok" };
  }
  @Get("ready") async ready(@Res({ passthrough: true }) reply: FastifyReply) {
    const result = await this.readiness.check("news-draft-api");
    reply.status(result.status === "ready" ? 200 : 503);
    return result;
  }
}
