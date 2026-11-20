"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { PRICE_PER_KG, STATUS_FLOW } from "@/lib/constants";
import { initialCustomers, initialOrders } from "@/lib/mock-data";
import type {
  CreateOrderInput,
  Customer,
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/lib/types";

const STORAGE_KEY = "lbs-laundry-prototype-v2";

type LaundryState = {
  customers: Customer[];
  orders: Order[];
};

type StatusUpdateResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "unpaid_pickup" };

type LaundryContextValue = LaundryState & {
  ready: boolean;
  addOrder: (input: CreateOrderInput) => Order;
  updateStatus: (orderId: string, status: OrderStatus) => StatusUpdateResult;
  advanceStatus: (orderId: string) => StatusUpdateResult;
  canSetStatus: (orderId: string, status: OrderStatus) => StatusUpdateResult;
  updatePayment: (orderId: string, paidAmount: number) => void;
  addCustomer: (input: Omit<Customer, "id">) => Customer;
  resetDemo: () => void;
};

const LaundryContext = createContext<LaundryContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function createNotaNumber(existing: Order[]) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const prefix = `LBS-${y}${m}${d}-`;
  const todayCount = existing.filter((o) =>
    o.notaNumber.startsWith(prefix),
  ).length;
  return `${prefix}${String(todayCount + 1).padStart(3, "0")}`;
}

function derivePaymentStatus(total: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return "belum_bayar";
  if (paidAmount >= total) return "lunas";
  return "sebagian";
}

function loadState(): LaundryState {
  return {
    customers: initialCustomers,
    orders: initialOrders,
  };
}

export function LaundryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LaundryState>(loadState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LaundryState;
        if (parsed?.customers && parsed?.orders) {
          setState(parsed);
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

  const addCustomer = useCallback((input: Omit<Customer, "id">) => {
    const customer: Customer = {
      id: createId("cus"),
      ...input,
    };
    setState((prev) => ({
      ...prev,
      customers: [customer, ...prev.customers],
    }));
    return customer;
  }, []);

  const addOrder = useCallback((input: CreateOrderInput): Order => {
    const now = new Date().toISOString();
    let nextOrder!: Order;

    setState((prev) => {
      let customerId = input.customerId;
      let customers = prev.customers;

      if (!customerId) {
        const created: Customer = {
          id: createId("cus"),
          name: input.customerName,
          phone: input.customerPhone,
          address: input.customerAddress ?? "",
        };
        customerId = created.id;
        customers = [created, ...customers];
      }

      const total = Math.round(input.weightKg * PRICE_PER_KG);
      nextOrder = {
        id: createId("ord"),
        notaNumber: createNotaNumber(prev.orders),
        customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        weightKg: input.weightKg,
        pricePerKg: PRICE_PER_KG,
        total,
        paidAmount: 0,
        paymentStatus: "belum_bayar",
        status: "diterima",
        notes: input.notes ?? "",
        createdAt: now,
        updatedAt: now,
      };

      return {
        customers,
        orders: [nextOrder, ...prev.orders],
      };
    });

    return nextOrder;
  }, []);

  const canSetStatus = useCallback(
    (orderId: string, status: OrderStatus): StatusUpdateResult => {
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false, reason: "not_found" };
      if (status === "diambil" && order.paymentStatus !== "lunas") {
        return { ok: false, reason: "unpaid_pickup" };
      }
      return { ok: true };
    },
    [state.orders],
  );

  const updateStatus = useCallback(
    (orderId: string, status: OrderStatus): StatusUpdateResult => {
      const check = canSetStatus(orderId, status);
      if (!check.ok) return check;

      setState((prev) => ({
        ...prev,
        orders: prev.orders.map((order) =>
          order.id === orderId
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order,
        ),
      }));
      return { ok: true };
    },
    [canSetStatus],
  );

  const advanceStatus = useCallback(
    (orderId: string): StatusUpdateResult => {
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return { ok: false, reason: "not_found" };

      const idx = STATUS_FLOW.indexOf(order.status);
      const next = STATUS_FLOW[Math.min(idx + 1, STATUS_FLOW.length - 1)];
      return updateStatus(orderId, next);
    },
    [state.orders, updateStatus],
  );

  const updatePayment = useCallback((orderId: string, paidAmount: number) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        const safePaid = Math.max(0, Math.min(paidAmount, order.total));
        return {
          ...order,
          paidAmount: safePaid,
          paymentStatus: derivePaymentStatus(order.total, safePaid),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = loadState();
    setState(fresh);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      addOrder,
      updateStatus,
      advanceStatus,
      canSetStatus,
      updatePayment,
      addCustomer,
      resetDemo,
    }),
    [
      state,
      ready,
      addOrder,
      updateStatus,
      advanceStatus,
      canSetStatus,
      updatePayment,
      addCustomer,
      resetDemo,
    ],
  );

  return (
    <LaundryContext.Provider value={value}>{children}</LaundryContext.Provider>
  );
}

export function useLaundry() {
  const ctx = useContext(LaundryContext);
  if (!ctx) {
    throw new Error("useLaundry harus dipakai di dalam LaundryProvider");
  }
  return ctx;
}
