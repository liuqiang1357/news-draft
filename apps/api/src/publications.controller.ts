import { PublicationsService } from "@news-draft/backend";
import { Controller, Get, Inject } from "@nestjs/common";
@Controller("publications")
export class PublicationsController {
  constructor(@Inject(PublicationsService) private readonly publications: PublicationsService) {}
  @Get() list() {
    return this.publications.list();
  }
}
