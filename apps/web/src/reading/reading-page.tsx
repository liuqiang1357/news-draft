"use client";
import { healthQueryOptions, publicationsQueryOptions } from "@news-draft/frontend/api/queries";
import { Button } from "@news-draft/frontend/ui/button";
import { EmptyState } from "@news-draft/frontend/ui/empty-state";
import { useQuery } from "@tanstack/react-query";

export function ReadingPage() {
  const health = useQuery(healthQueryOptions);
  const publications = useQuery(publicationsQueryOptions);
  return (
    <main className="mx-auto max-w-242 px-4.5 pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-6">
      <header className="flex items-center justify-between gap-6 border-b-2 border-ink pt-[max(1.5rem,env(safe-area-inset-top))] pb-6 sm:pt-8">
        <div className="font-editorial text-2xl font-bold tracking-tight italic sm:text-3xl">
          News Draft<span className="text-brand">.</span>
        </div>
        <span className="text-xs tracking-wider text-muted sm:tracking-widest">
          阅读 · 思考 · 复盘
        </span>
      </header>
      <section className="pt-10 pb-8 sm:pt-14">
        <span className="text-xs tracking-widest text-brand">READ WITH CONTEXT</span>
        <h1 className="my-4 text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">
          让信息，成为思考的起点。
        </h1>
        <p className="leading-relaxed text-muted">关注变化，留下判断，在新的证据中回看。</p>
      </section>
      <section aria-labelledby="reading-heading">
        <div className="flex items-center justify-between border-b border-line py-4">
          <h2 id="reading-heading" className="text-lg font-semibold">
            阅读
          </h2>
          <span className="text-xs text-muted">
            {health.isPending ? "正在连接" : health.isError ? "暂时无法连接" : "已连接"}
          </span>
        </div>
        {publications.isPending || publications.isError || !publications.data?.items.length ? (
          <EmptyState
            aria-busy={publications.isFetching}
            title={
              publications.isPending
                ? "正在获取内容"
                : publications.isError
                  ? "暂时无法获取内容"
                  : "还没有内容"
            }
            description={
              publications.isError
                ? "请稍后再试。"
                : publications.isPending
                  ? "请稍候。"
                  : "新的内容将在这里出现。"
            }
            icon={
              <svg
                aria-hidden="true"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <rect x="7" y="3" width="34" height="42" rx="3" />
                <path d="M15 15h18M15 24h18M15 33h12" />
              </svg>
            }
          >
            {publications.isError && (
              <Button
                className="mt-4"
                variant="outline"
                disabled={publications.isFetching}
                onClick={() => {
                  void publications.refetch();
                }}
              >
                重新获取
              </Button>
            )}
          </EmptyState>
        ) : (
          publications.data.items.map((item) => (
            <article key={item.id} className="border-b border-line py-7">
              <h3 className="mb-3 text-[1.375rem] leading-normal font-semibold wrap-anywhere">
                {item.title}
              </h3>
              <p className="text-sm text-muted">
                {item.sourceId} ·{" "}
                <time dateTime={item.publishedAt}>
                  {new Date(item.publishedAt).toLocaleString("zh-CN")}
                </time>
              </p>
              {item.url && /^https?:/.test(item.url) && (
                <Button asChild className="py-2" variant="link">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    查看原文 ↗
                  </a>
                </Button>
              )}
            </article>
          ))
        )}
      </section>
      <footer className="mt-12 text-xs text-muted">News Draft</footer>
    </main>
  );
}
