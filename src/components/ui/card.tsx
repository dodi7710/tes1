// Hallmark · component: card · design-system: design.md
import { type ElementType, type ComponentPropsWithoutRef } from "react";

type CardProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export default function Card<T extends ElementType = "div">({ as, className = "", ...props }: CardProps<T>) {
  const Component = as ?? "div";
  return <Component className={`rounded-card border border-rule bg-surface ${className}`} {...props} />;
}
