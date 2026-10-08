import type { ComponentProps, ReactNode } from "react";
import { cn } from "./cn.js";

export function EmptyState({
  children,
  className,
  description,
  icon,
  title,
  ...props
}: ComponentProps<"div"> & { description: string; icon?: ReactNode; title: string }) {
  return (
    <div
      className={cn(
        "border-b border-line bg-paper px-4 py-14 text-center sm:px-6 sm:py-18",
        className,
      )}
      role="status"
      {...props}
    >
      {icon && (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center text-brand [&_svg]:size-full">
          {icon}
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="leading-relaxed text-muted">{description}</p>
      {children}
    </div>
  );
}
