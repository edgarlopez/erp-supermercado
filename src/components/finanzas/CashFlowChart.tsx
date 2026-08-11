"use client";

import { BarChart } from "@mui/x-charts/BarChart";

export interface CashFlowDay {
  dia: string;
  ingresos: number;
  egresos: number;
}

export default function CashFlowChart({ data }: { data: CashFlowDay[] }) {
  return (
    <BarChart
      height={300}
      xAxis={[{ data: data.map((d) => new Date(d.dia).toLocaleDateString("es-MX", { weekday: "short" })), scaleType: "band" }]}
      series={[
        { data: data.map((d) => d.ingresos), label: "Ingresos", color: "#1b5e20" },
        { data: data.map((d) => d.egresos), label: "Egresos", color: "#e65100" },
      ]}
    />
  );
}
