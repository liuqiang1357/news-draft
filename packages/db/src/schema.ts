import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
// Only public source publications are supported by this foundation.
export const publications = pgTable(
  "source_publications",
  {
    id: uuid().defaultRandom().primaryKey(),
    sourceId: text().notNull(),
    externalId: text().notNull(),
    revision: text().notNull(),
    title: text().notNull(),
    url: text(),
    publishedAt: timestamp({ withTimezone: true }).notNull(),
    fetchedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("publication_source_version").on(table.sourceId, table.externalId, table.revision),
  ],
);
