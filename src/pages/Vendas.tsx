import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface VendaItem {
  [key: string]: string | number | null;
}

const Vendas = () => {
  const [apiUrl, setApiUrl] = useState("http://localhost:3001");
  const [dataInicio, setDataInicio] = useState("01/01/2025");
  const [dataFim, setDataFim] = useState("31/12/2025");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VendaItem[]>([]);
  const [error, setError] = useState("");
  const [columns, setColumns] = useState<string[]>([]);

  const fetchVendas = async () => {
    setLoading(true);
    setError("");
    setData([]);
    setColumns([]);

    try {
      const url = `${apiUrl}/api/vendas?dataInicio=${encodeURIComponent(dataInicio)}&dataFim=${encodeURIComponent(dataFim)}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        setData(result.data);
        if (result.data.length > 0) {
          setColumns(Object.keys(result.data[0]));
        }
      } else {
        setError(result.error || "Erro ao buscar dados");
      }
    } catch (err) {
      setError("Não foi possível conectar à API. Verifique se o servidor está rodando.");
    } finally {
      setLoading(false);
    }
  };

  const formatCellValue = (value: string | number | null): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "number") {
      return value.toLocaleString("pt-BR");
    }
    return String(value);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Relatório de Vendas</h1>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL da API</label>
                <Input
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="http://localhost:3001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Input
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <Input
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  placeholder="DD/MM/YYYY"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchVendas} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {data.length > 0 && (
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>
                Resultados ({data.length} registros)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((column) => (
                        <TableHead key={column} className="whitespace-nowrap">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row, index) => (
                      <TableRow key={index}>
                        {columns.map((column) => (
                          <TableCell key={column} className="whitespace-nowrap">
                            {formatCellValue(row[column])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && data.length === 0 && !error && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Use os filtros acima para buscar os dados de vendas.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Vendas;
