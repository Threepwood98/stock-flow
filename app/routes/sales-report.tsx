import { useState, useMemo } from "react";
import { useOutletContext } from "react-router";
import {
  format,
  startOfMonth,
  endOfMonth,
  parse,
  isValid,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { DateRangePicker } from "~/components/date-range-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { BanknoteIcon } from "lucide-react";
import { Label } from "~/components/ui/label";
import { ComboboxPlus } from "~/components/combobox-plus";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";

type ContextType = {
  sales: Array<{
    id: string;
    date: string;
    productId: string;
    productName: string;
    categoryId: string;
    categoryName: string;
    quantity: number;
    saleAmount: number;
    costAmount: number;
    profit: number;
    payMethod: string;
    salesAreaId: string;
    salesAreaName: string;
    storeId: string;
    storeName: string;
    userId: string;
    userName: string;
  }>;
  userStores: Array<{
    storeId: string;
    store: {
      id: string;
      name: string;
    };
  }>;
  salesAreas: Array<{
    id: string;
    name: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    costPrice: { d: number };
    salePrice: { d: number };
  }>;
};

export default function SalesReport() {
  const { sales, salesAreas, products } = useOutletContext<ContextType>();
  console.log("🚀 ~ SalesReport ~ sales:", sales);

  // Estados para filtros
  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(new Date()), "dd/MM/yyyy")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfMonth(new Date()), "dd/MM/yyyy")
  );

  const [selectedSalesAreaId, setSelectedSalesAreaId] = useState("all");

  const parseDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  // Filtrar ventas en el cliente
  const filteredSales = useMemo(() => {
    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);

    if (!fromDate || !toDate) return sales;

    let filtered = sales.filter((sale) => {
      const saleDate = parse(sale.date, "yyyy-MM-dd", new Date());

      if (!isValid(saleDate)) {
        toast.warning(`Fecha inválida encontrada: ${sale.date}`);
        return false;
      }

      const inRange = isWithinInterval(saleDate, {
        start: startOfDay(fromDate),
        end: endOfDay(toDate),
      });

      return inRange;
    });

    if (selectedSalesAreaId === "all") return filtered;

    if (selectedSalesAreaId) {
      filtered = filtered.filter(
        (sale) => sale.salesAreaId === selectedSalesAreaId
      );
    }

    return filtered;
  }, [sales, dateFrom, dateTo, selectedSalesAreaId]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 bg-gray-400">
      {/* Filtros */}
      <div className="w-full grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label className="pl-1">Rango de Fecha</Label>
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </div>
        {salesAreas.length > 1 && (
          <div className="grid gap-2">
            <Label htmlFor="salesAreaId" className="pl-1">
              Área de Venta
            </Label>
            <ComboboxPlus
              name="salesAreaId"
              className="w-full"
              options={[
                { value: "all", label: "Todas las áreas" },
                ...salesAreas.map((sa) => ({
                  value: sa.id,
                  label: sa.name,
                })),
              ]}
              value={selectedSalesAreaId}
              onChange={(value) => setSelectedSalesAreaId(value)}
              required
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="product" className="pl-1">
            Producto
          </Label>
          <ComboboxPlus
            name="product"
            className="w-full min-w-40"
            options={products.map((prod) => ({
              value: prod.id,
              label: prod.name,
            }))}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Precio Venta</TableHead>
            <TableHead>Precio Costo</TableHead>
            <TableHead>Ganancia</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Tienda</TableHead>
            {salesAreas.length > 1 && <TableHead>Aréa de Venta</TableHead>}
            <TableHead>Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSales.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={salesAreas.length > 1 ? 11 : 10}
                className="text-center text-muted-foreground py-8"
              >
                <div className="flex flex-col items-center gap-4">
                  <BanknoteIcon className="size-32" />
                  <p className="font-semibold">
                    No hay ventas disponibles para este rango de fecha.
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredSales.map((sale, index) => (
              <TableRow key={index}>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.productName}</TableCell>
                <TableCell>{sale.categoryName}</TableCell>
                <TableCell>{sale.quantity}</TableCell>
                <TableCell>{sale.saleAmount}</TableCell>
                <TableCell>{sale.costAmount}</TableCell>
                <TableCell>{sale.profit}</TableCell>
                <TableCell>{sale.payMethod}</TableCell>
                <TableCell>{sale.storeName}</TableCell>
                {salesAreas.length > 1 && (
                  <TableCell>{sale.salesAreaName}</TableCell>
                )}
                <TableCell>{sale.userName}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
