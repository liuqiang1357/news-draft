import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "./cn.js";

const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded border px-4.5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "border-brand bg-brand text-white hover:bg-brand/90",
        outline: "border-brand-soft bg-white text-brand hover:bg-brand/5",
        link: "min-h-0 rounded-none border-0 bg-transparent p-0 text-brand hover:underline",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Button({
  asChild = false,
  className,
  type,
  variant,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(buttonVariants({ variant }), className)}
      type={asChild ? type : (type ?? "button")}
      {...props}
    />
  );
}
