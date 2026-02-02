import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MESES, EQUIPES, ANOS_DISPONIVEIS } from "@/lib/constants";
import { Calendar, Users, Filter, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FiltrosVendasProps {
  ano: number;
  mes: number;
  equipe: string;
  onAnoChange: (ano: number) => void;
  onMesChange: (mes: number) => void;
  onEquipeChange: (equipe: string) => void;
  mesAtualMax?: number;
  sectorLocked?: boolean;
  sectorLabel?: string;
}

export function FiltrosVendas({
  ano,
  mes,
  equipe,
  onAnoChange,
  onMesChange,
  onEquipeChange,
  mesAtualMax = 12,
  sectorLocked = false,
  sectorLabel,
}: FiltrosVendasProps) {
  const anoAtual = new Date().getFullYear();
  const mesesDisponiveis = ano === anoAtual ? MESES.filter((m) => m.valor <= mesAtualMax) : MESES;

  return (
    <Card className="shadow-elegant">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={ano.toString()} onValueChange={(v) => onAnoChange(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANOS_DISPONIVEIS.map((a) => (
                  <SelectItem key={a} value={a.toString()}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Select value={mes.toString()} onValueChange={(v) => onMesChange(parseInt(v))}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mesesDisponiveis.map((m) => (
                  <SelectItem key={m.valor} value={m.valor.toString()}>
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {sectorLocked ? (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="px-3 py-1">
                {sectorLabel || "Equipe restrita"}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Select value={equipe} onValueChange={onEquipeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPES.map((e) => (
                    <SelectItem key={e.valor} value={e.valor}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
