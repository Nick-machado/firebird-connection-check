import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatCompactCurrency, formatCurrencyExact, formatPercent, formatNumber } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, TrendingUp, Package, Receipt, Users, ShoppingBag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegionalFullDetailsModal } from "./RegionalFullDetailsModal";
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

interface RegionalDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  dadosEstado: DadosRegionais | null;
  topProdutos: { nome: string; valor: number }[];
  topClientes: { nome: string; valor: number }[];
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

function TopList({ 
  titulo, 
  items, 
  icon: Icon 
}: { 
  titulo: string; 
  items: { nome: string; valor: number }[];
  icon: React.ElementType;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">{titulo}</h4>
      </div>
      <div className="space-y-1">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="truncate flex-1 mr-2" title={item.nome}>
              {idx + 1}. {item.nome}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="font-medium cursor-help whitespace-nowrap">
                  {formatCompactCurrency(item.valor)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatCurrencyExact(item.valor)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RegionalDetailPanel({
  isOpen,
  onClose,
  dadosEstado,
  topProdutos,
  topClientes,
  todosProdutos,
  todosClientes,
  todosCanais,
}: RegionalDetailPanelProps) {
  const [isFullDetailsOpen, setIsFullDetailsOpen] = useState(false);

  if (!dadosEstado) {
    return null;
  }

  const nomeEstado = UF_NOMES[dadosEstado.uf] || dadosEstado.uf;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <SheetTitle>{nomeEstado}</SheetTitle>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Região: {dadosEstado.regiao}
            </p>
          </SheetHeader>

          <div className="space-y-6">
            {/* Botão Informações Completas */}
            <Button 
              onClick={() => setIsFullDetailsOpen(true)}
              className="w-full gap-2"
              size="lg"
            >
              <ExternalLink className="h-4 w-4" />
              Informações Completas
            </Button>

            {/* Métricas principais */}
            <div className="grid grid-cols-2 gap-3">
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
              <div className="col-span-2">
                <MetricaCard
                  titulo="Notas Emitidas"
                  valor={formatNumber(dadosEstado.notas)}
                  valorExato={formatNumber(dadosEstado.notas)}
                  icon={Receipt}
                />
              </div>
            </div>

            {/* Top Produtos */}
            <TopList
              titulo="Top 5 Produtos"
              items={topProdutos}
              icon={ShoppingBag}
            />

            {/* Top Clientes */}
            <TopList
              titulo="Top 5 Clientes"
              items={topClientes}
              icon={Users}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Modal de Informações Completas */}
      <RegionalFullDetailsModal
        isOpen={isFullDetailsOpen}
        onClose={() => setIsFullDetailsOpen(false)}
        dadosEstado={dadosEstado}
        todosProdutos={todosProdutos}
        todosClientes={todosClientes}
        todosCanais={todosCanais}
      />
    </>
  );
}
