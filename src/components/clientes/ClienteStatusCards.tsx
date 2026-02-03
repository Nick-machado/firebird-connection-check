import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ClientesStatusData, ClienteStatus } from "@/types/cliente";
import { UserCheck, AlertTriangle, UserX, Users } from "lucide-react";

interface ClienteStatusCardsProps {
  data: ClientesStatusData;
  activeFilter: ClienteStatus | "todos";
  onFilterChange: (status: ClienteStatus | "todos") => void;
}

export function ClienteStatusCards({
  data,
  activeFilter,
  onFilterChange,
}: ClienteStatusCardsProps) {
  const cards = [
    {
      id: "todos" as const,
      label: "Todos",
      quantidade: data.total,
      icon: Users,
      bgColor: "bg-muted/50",
      textColor: "text-foreground",
      borderColor: "border-border",
      activeColor: "ring-2 ring-primary",
    },
    {
      id: "ativo" as const,
      label: "Ativos",
      quantidade: data.ativos.quantidade,
      description: "Compraram nos últimos 3 meses",
      icon: UserCheck,
      bgColor: "bg-green-500/10",
      textColor: "text-green-600",
      borderColor: "border-green-500/20",
      activeColor: "ring-2 ring-green-500",
    },
    {
      id: "em_risco" as const,
      label: "Em Risco",
      quantidade: data.emRisco.quantidade,
      description: "Sem compras entre 3-6 meses",
      icon: AlertTriangle,
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-600",
      borderColor: "border-yellow-500/20",
      activeColor: "ring-2 ring-yellow-500",
    },
    {
      id: "inativo" as const,
      label: "Inativos",
      quantidade: data.inativos.quantidade,
      description: "Sem compras há mais de 6 meses",
      icon: UserX,
      bgColor: "bg-red-500/10",
      textColor: "text-red-600",
      borderColor: "border-red-500/20",
      activeColor: "ring-2 ring-red-500",
    },
  ];

  return (
    <Card className="shadow-elegant">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Classificação por Atividade</CardTitle>
        <p className="text-sm text-muted-foreground">
          Clique em um card para filtrar a tabela abaixo
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const isActive = activeFilter === card.id;

            return (
              <button
                key={card.id}
                onClick={() => onFilterChange(card.id)}
                className={cn(
                  "rounded-lg p-4 border text-left transition-all duration-200",
                  card.bgColor,
                  card.borderColor,
                  isActive && card.activeColor,
                  "hover:scale-[1.02] hover:shadow-md cursor-pointer"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("h-4 w-4", card.textColor)} />
                  <span className="text-sm font-medium">{card.label}</span>
                </div>
                <p className={cn("text-2xl font-bold", card.textColor)}>
                  {card.quantidade.toLocaleString("pt-BR")}
                </p>
                {card.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
