import { getDataSource } from "@/lib/db/data-source";

export const TOOL_DEFINITIONS = [
  {
    name: "get_sales_summary",
    description: "Obtiene el total vendido y el numero de ventas para un periodo (hoy, semana o mes actual).",
    input_schema: {
      type: "object" as const,
      properties: {
        periodo: { type: "string", enum: ["hoy", "semana", "mes"], description: "Periodo a consultar" },
      },
      required: ["periodo"],
    },
  },
  {
    name: "get_product_stock",
    description: "Busca productos por nombre o SKU y regresa su stock actual, unidad y precio.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Nombre o parte del nombre del producto, ej. 'tomate'" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_top_products",
    description: "Regresa los productos mas vendidos (por cantidad) en los ultimos N dias.",
    input_schema: {
      type: "object" as const,
      properties: {
        dias: { type: "integer", description: "Numero de dias hacia atras a considerar, ej. 7 para 'esta semana'" },
      },
      required: ["dias"],
    },
  },
  {
    name: "get_cash_flow",
    description: "Compara ingresos (ventas) contra egresos (gastos) en un periodo (semana o mes actual).",
    input_schema: {
      type: "object" as const,
      properties: {
        periodo: { type: "string", enum: ["semana", "mes"], description: "Periodo a consultar" },
      },
      required: ["periodo"],
    },
  },
  {
    name: "get_low_stock_products",
    description: "Lista los productos cuyo stock actual esta en o por debajo de su stock minimo (alerta de stock bajo).",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
];

const PERIOD_TRUNC: Record<string, string> = { hoy: "day", semana: "week", mes: "month" };

export async function executeTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  const db = await getDataSource();

  switch (name) {
    case "get_sales_summary": {
      const trunc = PERIOD_TRUNC[input.periodo as string] ?? "day";
      const [row] = await db.query(
        `select coalesce(sum(total), 0) as total, count(*) as ventas
         from sales where created_at >= date_trunc('${trunc}', now())`,
      );
      return { periodo: input.periodo, total_vendido: Number(row.total), numero_de_ventas: Number(row.ventas) };
    }

    case "get_product_stock": {
      const rows = await db.query(
        `select sku, nombre, unidad, stock, precio from products where nombre ilike $1 or sku ilike $1 limit 10`,
        [`%${input.query}%`],
      );
      return rows.length > 0 ? rows : { mensaje: "No se encontraron productos con ese nombre" };
    }

    case "get_top_products": {
      const dias = Number(input.dias) || 7;
      const rows = await db.query(
        `select si.sku, si.nombre, sum(si.cantidad) as cantidad_vendida
         from sale_items si join sales s on s.id = si.sale_id
         where s.created_at >= now() - ($1 || ' days')::interval
         group by si.sku, si.nombre order by sum(si.cantidad) desc limit 5`,
        [dias],
      );
      return rows.map((r: { sku: string; nombre: string; cantidad_vendida: string }) => ({
        ...r,
        cantidad_vendida: Number(r.cantidad_vendida),
      }));
    }

    case "get_cash_flow": {
      const trunc = input.periodo === "mes" ? "month" : "week";
      const [row] = await db.query(
        `select
          coalesce((select sum(total) from sales where created_at >= date_trunc('${trunc}', now())), 0) as ingresos,
          coalesce((select sum(monto) from expenses where fecha >= date_trunc('${trunc}', now())::date), 0) as egresos`,
      );
      return { periodo: input.periodo, ingresos: Number(row.ingresos), egresos: Number(row.egresos) };
    }

    case "get_low_stock_products": {
      const rows = await db.query(`select sku, nombre, stock, stock_minimo from products where stock <= stock_minimo order by stock asc`);
      return rows.length > 0 ? rows : { mensaje: "No hay productos con stock bajo en este momento" };
    }

    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}
