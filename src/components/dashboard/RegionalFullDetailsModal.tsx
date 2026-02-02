import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { formatCompactCurrency, formatCurrencyExact, formatPercent, formatNumber } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, TrendingUp, Package, Receipt, Users, ShoppingBag, Store, Search } from "lucide-react";
import type { DadosRegionais, CanalPorRegiao } from "@/lib/regionalProcessing";

// Nomes dos estados
const UF_NOMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

interface RegionalFullDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dadosEstado: DadosRegionais | null;
  todosProdutos: { nome: string; valor: number }[];
  todosClientes: { nome: string; valor: number }[];
  todosCanais: CanalPorRegiao[];
}

function MetricaCard({ 
  titulo, 
  valor, 
  valorExato, 
  icon: Icon 
}: { 
  titulo: string; 
  valor: string; 
  valorExato: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{titulo}</span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-lg font-bold cursor-help">{valor}</p>
        </TooltipTrigger>
        <TooltipContent>
          <p>{valorExato}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function ListaCompleta({ 
  items = [], 
  searchPlaceholder 
}: { 
  items: { nome: string; valor: number }[];
  searchPlaceholder: string;
}) {
  const [search, setSearch] = useState("");
  
  // Garantir que items é sempre um array
  const safeItems = items || [];

  const itensFiltrados = useMemo(() => {
    if (!search.trim()) return safeItems;
    return safeItems.filter((item) => 
      item.nome.toLowerCase().includes(search.toLowerCase())
    );
  }, [safeItems, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-1 pr-4">
          {itensFiltrados.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum resultado encontrado
            </p>
          ) : (
            itensFiltrados.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    {idx + 1}.
                  </span>
                  <span className="truncate text-sm" title={item.nome}>
                    {item.nome}
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-sm cursor-help whitespace-nowrap ml-2">
                      {formatCompactCurrency(item.valor)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{formatCurrencyExact(item.valor)}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground text-center">
        Mostrando {itensFiltrados.length} de {safeItems.length} itens
      </p>
    </div>
  );
}

function ListaCanais({ 
  canais = [] 
}: { 
  canais: CanalPorRegiao[];
}) {
  const [search, setSearch] = useState("");
  
  // Garantir que canais é sempre um array
  const safeCanais = canais || [];

  const canaisFiltrados = useMemo(() => {
    if (!search.trim()) return safeCanais;
    return safeCanais.filter((item) => 
      item.canal.toLowerCase().includes(search.toLowerCase())
    );
  }, [safeCanais, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar canal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <ScrollArea className="h-[400px]">
        <div className="space-y-1 pr-4">
          {canaisFiltrados.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum resultado encontrado
            </p>
          ) : (
            canaisFiltrados.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-8">
                    {idx + 1}.
                  </span>
                  <span className="truncate text-sm" title={item.canal}>
                    {item.canal}
                  </span>
                </div>
                <div className="flex items-center gap-4 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium text-sm cursor-help whitespace-nowrap">
                        {formatCompactCurrency(item.faturamento)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatCurrencyExact(item.faturamento)}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-xs text-muted-foreground whitespace-nowrap w-12 text-right">
                    {formatPercent(item.percentual)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <p className="text-xs text-muted-foreground text-center">
        Mostrando {canaisFiltrados.length} de {safeCanais.length} canais
      </p>
    </div>
  );
}

export function RegionalFullDetailsModal({
  isOpen,
  onClose,
  dadosEstado,
  todosProdutos = [],
  todosClientes = [],
  todosCanais = [],
}: RegionalFullDetailsModalProps) {
  // Garantir que os arrays nunca sejam undefined
  const produtos = todosProdutos || [];
  const clientes = todosClientes || [];
  const canais = todosCanais || [];

  if (!dadosEstado) {
    return null;
  }

  const nomeEstado = UF_NOMES[dadosEstado.uf] || dadosEstado.uf;
  const isRegiao = !UF_NOMES[dadosEstado.uf];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl">
              {isRegiao ? `Região ${dadosEstado.uf}` : nomeEstado}
            </DialogTitle>
          </div>
          {!isRegiao && (
            <p className="text-sm text-muted-foreground">
              Região: {dadosEstado.regiao}
            </p>
          )}
        </DialogHeader>

        {/* Métricas principais */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-4 border-b">
          <MetricaCard
            titulo="Faturamento"
            valor={formatCompactCurrency(dadosEstado.faturamento)}
            valorExato={formatCurrencyExact(dadosEstado.faturamento)}
            icon={TrendingUp}
          />
          <MetricaCard
            titulo="Margem"
            valor={formatCompactCurrency(dadosEstado.margem)}
            valorExato={formatCurrencyExact(dadosEstado.margem)}
            icon={TrendingUp}
          />
          <MetricaCard
            titulo="Margem %"
            valor={formatPercent(dadosEstado.margemPercentual)}
            valorExato={formatPercent(dadosEstado.margemPercentual)}
            icon={TrendingUp}
          />
          <MetricaCard
            titulo="Quantidade"
            valor={formatNumber(dadosEstado.quantidade)}
            valorExato={formatNumber(dadosEstado.quantidade)}
            icon={Package}
          />
          <MetricaCard
            titulo="Notas Emitidas"
            valor={formatNumber(dadosEstado.notas)}
            valorExato={formatNumber(dadosEstado.notas)}
            icon={Receipt}
          />
        </div>

        {/* Tabs com listas completas */}
        <Tabs defaultValue="produtos" className="flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="produtos" className="gap-1 text-xs sm:text-sm">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Produtos</span>
              <span className="text-xs text-muted-foreground">({produtos.length})</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="gap-1 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
              <span className="text-xs text-muted-foreground">({clientes.length})</span>
            </TabsTrigger>
            <TabsTrigger value="canais" className="gap-1 text-xs sm:text-sm">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Canais</span>
              <span className="text-xs text-muted-foreground">({canais.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="produtos" className="mt-0 data-[state=active]:block">
              <ListaCompleta
                items={produtos}
                searchPlaceholder="Buscar produto..."
              />
            </TabsContent>

            <TabsContent value="clientes" className="mt-0 data-[state=active]:block">
              <ListaCompleta
                items={clientes}
                searchPlaceholder="Buscar cliente..."
              />
            </TabsContent>

            <TabsContent value="canais" className="mt-0 data-[state=active]:block">
              <ListaCanais canais={canais} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
