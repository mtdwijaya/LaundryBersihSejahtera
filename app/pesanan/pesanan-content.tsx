"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  EmptyState,
  PageHeader,
  Panel,
  PaymentBadge,
  StatusBadge,
} from "@/components/ui";
import {
  PAYMENT_LABEL,
  STATUS_FLOW,
  STATUS_LABEL,
} from "@/lib/constants";
import { formatDate, formatKg, formatRupiah } from "@/lib/format";
import { useLaundry } from "@/lib/store";
import type { Order, OrderStatus, PaymentStatus } from "@/lib/types";

type SortColumn =
  | "customerName"
  | "weightKg"
  | "total"
  | "status"
  | "paymentStatus"
  | "createdAt";

type SortDir = "asc" | "desc";

type FilterKey =
  | "all"
  | OrderStatus
  | PaymentStatus
  | "piutang";

const PAGE_SIZE = 10;

const PAYMENT_FLOW: PaymentStatus[] = ["belum_bayar", "sebagian", "lunas"];

const FILTER_OPTIONS: { value: FilterKey; label: string; group: string }[] = [
  { value: "all", label: "Semua", group: "Umum" },
  { value: "piutang", label: "Piutang (belum lunas)", group: "Pembayaran" },
  ...PAYMENT_FLOW.map((item) => ({
    value: item as FilterKey,
    label: PAYMENT_LABEL[item],
    group: "Pembayaran",
  })),
  ...STATUS_FLOW.map((item) => ({
    value: item as FilterKey,
    label: STATUS_LABEL[item],
    group: "Proses cucian",
  })),
];

const PAYMENT_RANK = {
  belum_bayar: 0,
  sebagian: 1,
  lunas: 2,
} as const;

const SORTABLE: { key: SortColumn; label: string }[] = [
  { key: "customerName", label: "Pelanggan" },
  { key: "weightKg", label: "Berat" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "paymentStatus", label: "Bayar" },
  { key: "createdAt", label: "Masuk" },
];

function isFilterKey(value: string | null): value is FilterKey {
  return FILTER_OPTIONS.some((option) => option.value === value);
}

function matchesFilter(order: Order, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "piutang") return order.paymentStatus !== "lunas";
  if (STATUS_FLOW.includes(filter as OrderStatus)) {
    return order.status === filter;
  }
  return order.paymentStatus === filter;
}

function compareOrders(a: Order, b: Order, column: SortColumn, dir: SortDir) {
  let result = 0;

  switch (column) {
    case "customerName":
      result = a.customerName.localeCompare(b.customerName, "id");
      break;
    case "weightKg":
      result = a.weightKg - b.weightKg;
      break;
    case "total":
      result = a.total - b.total;
      break;
    case "status":
      result = STATUS_FLOW.indexOf(a.status) - STATUS_FLOW.indexOf(b.status);
      break;
    case "paymentStatus":
      result =
        PAYMENT_RANK[a.paymentStatus] - PAYMENT_RANK[b.paymentStatus];
      break;
    case "createdAt":
      result = +new Date(a.createdAt) - +new Date(b.createdAt);
      break;
  }

  return dir === "asc" ? result : -result;
}

function SortHeader({
  label,
  column,
  activeColumn,
  dir,
  onSort,
}: {
  label: string;
  column: SortColumn;
  activeColumn: SortColumn;
  dir: SortDir;
  onSort: (column: SortColumn) => void;
}) {
  const active = activeColumn === column;

  return (
    <th>
      <button
        type="button"
        className={`inline-flex cursor-pointer items-center gap-1 bg-transparent p-0 text-left text-[0.75rem] font-bold uppercase tracking-[0.04em] hover:text-ink ${
          active ? "text-ink" : "text-ink/55"
        }`}
        onClick={() => onSort(column)}
        aria-label={`Urutkan ${label}`}
      >
        {label}
        {active ? (
          <span aria-hidden="true">{dir === "asc" ? "↑" : "↓"}</span>
        ) : null}
      </button>
    </th>
  );
}

export function PesananContent() {
  const { orders } = useLaundry();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawFilter = searchParams.get("filter");
  const filter: FilterKey = isFilterKey(rawFilter) ? rawFilter : "all";

  const [query, setQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = orders.filter((order) => {
      const matchFilter = matchesFilter(order, filter);
      const matchQuery =
        !q ||
        order.notaNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });

    return [...list].sort((a, b) =>
      compareOrders(a, b, sortColumn, sortDir),
    );
  }, [orders, query, filter, sortColumn, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, filter, sortColumn, sortDir]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDir(column === "customerName" || column === "status" ? "asc" : "desc");
  }

  function handleFilterChange(value: FilterKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    const queryString = params.toString();
    router.replace(queryString ? `/pesanan?${queryString}` : "/pesanan");
  }

  const groupedOptions = FILTER_OPTIONS.reduce<
    Record<string, typeof FILTER_OPTIONS>
  >((acc, option) => {
    (acc[option.group] ??= []).push(option);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        eyebrow="Operasional"
        title="Daftar pesanan"
        description="Cari berdasarkan nomor nota, nama, atau nomor HP. Filter proses cucian atau status pembayaran."
      />

      <Panel className="mb-5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div className="field">
            <label htmlFor="search">Cari</label>
            <input
              id="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nota / nama / HP"
            />
          </div>
          <div className="field">
            <label htmlFor="filter">Filter</label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value as FilterKey)}
            >
              {Object.entries(groupedOptions).map(([group, options]) => (
                <optgroup key={group} label={group}>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
      </Panel>

      {filtered.length === 0 ? (
        <EmptyState
          title="Tidak ada pesanan"
          description="Coba ubah kata kunci atau filter."
        />
      ) : (
        <Panel className="overflow-hidden p-0">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Nota</th>
                  {SORTABLE.map((column) => (
                    <SortHeader
                      key={column.key}
                      label={column.label}
                      column={column.key}
                      activeColumn={sortColumn}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link
                        href={`/pesanan/${order.id}`}
                        className="font-bold text-brand-deep hover:underline"
                      >
                        {order.notaNumber}
                      </Link>
                    </td>
                    <td>
                      <div className="font-semibold">{order.customerName}</div>
                      <div className="text-sm text-ink/55">
                        {order.customerPhone}
                      </div>
                    </td>
                    <td>{formatKg(order.weightKg)}</td>
                    <td>{formatRupiah(order.total)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      <PaymentBadge status={order.paymentStatus} />
                    </td>
                    <td className="text-sm text-ink/65">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-ink/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink/60">
              Menampilkan {rangeStart}–{rangeEnd} dari {filtered.length} pesanan
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="touch-target rounded-full border-2 border-ink bg-white px-4 text-sm font-bold shadow-hard disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const active = pageNumber === page;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      className={`touch-target min-w-11 rounded-full border-2 border-ink px-3 text-sm font-bold ${
                        active
                          ? "bg-ink text-white"
                          : "bg-white text-ink shadow-hard"
                      }`}
                      onClick={() => setPage(pageNumber)}
                      aria-current={active ? "page" : undefined}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="touch-target rounded-full border-2 border-ink bg-white px-4 text-sm font-bold shadow-hard disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
