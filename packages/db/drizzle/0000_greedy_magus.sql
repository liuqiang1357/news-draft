CREATE TABLE "source_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sourceId" text NOT NULL,
	"externalId" text NOT NULL,
	"revision" text NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"publishedAt" timestamp with time zone NOT NULL,
	"fetchedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "publication_source_version" ON "source_publications" USING btree ("sourceId","externalId","revision");