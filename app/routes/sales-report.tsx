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
import { toast } from "sonner";
import type { OutletContext } from "~/lib/types/types";
import { Button } from "~/components/ui/button";

export default function SalesReport() {
  const { sales, salesAreas, products, categories } =
    useOutletContext<OutletContext>();

  // Estados para filtros
  const [dateFrom, setDateFrom] = useState(
    format(startOfMonth(new Date()), "dd/MM/yyyy")
  );
  const [dateTo, setDateTo] = useState(
    format(endOfMonth(new Date()), "dd/MM/yyyy")
  );
  const [salesAreaId, setSalesAreaId] = useState<string>("all");
  const [productId, setProductId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [payMethod, setPayMethod] = useState<string>("all");

  const parseDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  const paymentMethods = useMemo(() => {
    const methods = new Set(sales.map((sale) => sale.payMethod));
    return Array.from(methods).sort();
  }, [sales]);

  const filteredSales = useMemo(() => {
    const fromDate = parseDate(dateFrom);
    const toDate = parseDate(dateTo);

    if (!fromDate || !toDate) return sales;

    let filtered = sales.filter((sale) => {
      // Filtro por fecha
      const saleDate = parse(sale.date, "yyyy-MM-dd", new Date());

      if (!isValid(saleDate)) {
        toast.warning(`Fecha inválida encontrada: ${sale.date}`);
        return false;
      }

      const inRange = isWithinInterval(saleDate, {
        start: startOfDay(fromDate),
        end: endOfDay(toDate),
      });

      if (!inRange) return false;

      // Filtro por área de venta
      if (salesAreaId !== "all" && sale.salesAreaId !== salesAreaId) {
        return false;
      }

      // Filtro por producto
      if (productId !== "all" && sale.productId !== productId) {
        return false;
      }

      // Filtro por categoría
      if (categoryId !== "all" && sale.categoryId !== categoryId) {
        return false;
      }

      // Filtro por método de pago
      if (payMethod !== "all" && sale.payMethod !== payMethod) {
        return false;
      }

      return true;
    });

    return filtered;
  }, [sales, dateFrom, dateTo, salesAreaId, productId, categoryId, payMethod]);

  const clearFilters = () => {
    setDateFrom(format(startOfMonth(new Date()), "dd/MM/yyyy"));
    setDateTo(format(endOfMonth(new Date()), "dd/MM/yyyy"));
    setSalesAreaId("all");
    setProductId("all");
    setCategoryId("all");
    setPayMethod("all");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      {/* Filtros */}
      <div className="w-full grid grid-cols-4 gap-4">
        <div className="grid gap-2">
          <Label className="pl-1">Rango de Fecha</Label>
          <DateRangePicker
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product" className="pl-1">
            Producto
          </Label>
          <ComboboxPlus
            name="product"
            className="w-full min-w-40"
            options={[
              { value: "all", label: "Todos" },
              ...products.map((prod) => ({
                value: prod.id,
                label: prod.name,
              })),
            ]}
            value={productId}
            onChange={(value) => setProductId(value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category" className="pl-1">
            Categoría
          </Label>
          <ComboboxPlus
            name="category"
            className="w-full"
            options={[
              { value: "all", label: "Todas" },
              ...categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
            ]}
            value={categoryId}
            onChange={(value) => setCategoryId(value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="payMethod" className="pl-1">
            Método de Pago
          </Label>
          <ComboboxPlus
            name="payMethod"
            className="w-full"
            options={[
              { value: "all", label: "Todos" },
              ...paymentMethods.map((method) => ({
                value: method,
                label: method,
              })),
            ]}
            value={payMethod}
            onChange={(value) => setPayMethod(value)}
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
                { value: "all", label: "Todas" },
                ...salesAreas.map((sa) => ({
                  value: sa.id,
                  label: sa.name,
                })),
              ]}
              value={salesAreaId}
              onChange={(value) => setSalesAreaId(value)}
              required
            />
          </div>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Precio Venta</TableHead>
            <TableHead className="text-right">Precio Costo</TableHead>
            <TableHead>Método de Pago</TableHead>
            {salesAreas.length > 1 && <TableHead>Aréa de Venta</TableHead>}
            {/* <TableHead>Usuario</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSales.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={salesAreas.length > 1 ? 8 : 7}
                className="text-center text-muted-foreground py-8"
              >
                <div className="flex flex-col items-center gap-4">
                  <BanknoteIcon className="size-32" />
                  <p className="font-semibold">
                    No hay ventas disponibles para este rango de fecha.
                  </p>
                  <Button onClick={clearFilters}>Limpiar Filtros</Button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            filteredSales.map((sale, index) => (
              <TableRow key={index}>
                <TableCell>{sale.date}</TableCell>
                <TableCell>{sale.productName}</TableCell>
                <TableCell>{sale.categoryName}</TableCell>
                <TableCell className="text-right">{sale.quantity}</TableCell>
                <TableCell className="text-right">{sale.saleAmount}</TableCell>
                <TableCell className="text-right">{sale.costAmount}</TableCell>
                <TableCell>{sale.payMethod}</TableCell>
                {salesAreas.length > 1 && (
                  <TableCell>{sale.salesAreaName}</TableCell>
                )}
                {/* <TableCell>{sale.userName}</TableCell> */}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
