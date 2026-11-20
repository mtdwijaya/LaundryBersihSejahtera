import { Suspense } from "react";
import { PesananContent } from "@/app/pesanan/pesanan-content";
import { Panel } from "@/components/ui";

export default function PesananPage() {
  return (
    <Suspense
      fallback={
        <Panel className="p-6">
          <p className="text-ink/60">Memuat daftar pesanan…</p>
        </Panel>
      }
    >
      <PesananContent />
    </Suspense>
  );
}
