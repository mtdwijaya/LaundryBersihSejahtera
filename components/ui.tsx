import Link from "next/link";
import { PAYMENT_LABEL, STATUS_LABEL } from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-base text-ink/70">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`panel ${className}`}>{children}</div>;
}

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  type = "button",
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}) {
  const styles = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    danger: "btn-danger",
  }[variant];

  const classes = `btn ${styles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = {
    diterima: "badge-teal",
    dicuci: "badge-yellow",
    selesai: "badge-lilac",
    diambil: "badge-ink",
  }[status];

  return <span className={`badge ${tone}`}>{STATUS_LABEL[status]}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const tone = {
    belum_bayar: "badge-rose",
    sebagian: "badge-yellow",
    lunas: "badge-teal",
  }[status];

  return <span className={`badge ${tone}`}>{PAYMENT_LABEL[status]}</span>;
}

export function StatCard({
  label,
  value,
  hint,
  accent = "teal",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "teal" | "yellow" | "lilac";
}) {
  const top = {
    teal: "bg-brand",
    yellow: "bg-sun",
    lilac: "bg-lilac",
  }[accent];

  return (
    <div className="panel overflow-hidden p-0">
      <div className={`h-2 ${top}`} />
      <div className="p-5">
        <p className="text-sm font-medium text-ink/60">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold text-ink">{value}</p>
        {hint ? <p className="mt-1 text-sm text-ink/55">{hint}</p> : null}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-ink/20 bg-white/60 px-6 py-12 text-center">
      <p className="font-display text-xl font-bold text-ink">{title}</p>
      <p className="mt-2 text-ink/60">{description}</p>
    </div>
  );
}
