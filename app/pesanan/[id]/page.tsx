import { Suspense } from "react";
import { OrderDetail } from "@/app/pesanan/[id]/order-detail";
import { Panel } from "@/components/ui";
import { initialOrders } from "@/lib/mock-data";

export function generateStaticParams() {
  return initialOrders.map((order) => ({ id: order.id }));
}

export default async function PesananDetailPage({
  params,
}: PageProps<"/pesanan/[id]">) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <Panel className="p-6">
          <p className="text-ink/60">Memuat detail pesanan…</p>
        </Panel>
      }
    >
      <OrderDetail id={id} />
    </Suspense>
  );
}
