import type { PublicationList } from "@news-draft/contracts";
import { publications, type Database } from "@news-draft/db";
import { Inject, Injectable } from "@nestjs/common";
import { desc } from "drizzle-orm";
import { DATABASE } from "./tokens.js";
@Injectable()
export class PublicationsService {
  constructor(@Inject(DATABASE) private readonly database: Database) {}
  async list(): Promise<PublicationList> {
    const rows = await this.database
      .select({
        id: publications.id,
        title: publications.title,
        sourceId: publications.sourceId,
        url: publications.url,
        publishedAt: publications.publishedAt,
      })
      .from(publications)
      .orderBy(desc(publications.publishedAt), desc(publications.id))
      .limit(20);
    return { items: rows.map((row) => ({ ...row, publishedAt: row.publishedAt.toISOString() })) };
  }
}
