import { createContext, useContext, useState, ReactNode } from "react";

interface FiltrosContextType {
  ano: number;
  mes: number;
  equipe: string;
  setAno: (ano: number) => void;
  setMes: (mes: number) => void;
  setEquipe: (equipe: string) => void;
}

const FiltrosContext = createContext<FiltrosContextType | undefined>(undefined);

export function FiltrosProvider({ children }: { children: ReactNode }) {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [equipe, setEquipe] = useState("TODAS");

  return (
    <FiltrosContext.Provider value={{ ano, mes, equipe, setAno, setMes, setEquipe }}>
      {children}
    </FiltrosContext.Provider>
  );
}

export function useFiltros() {
  const context = useContext(FiltrosContext);
  if (!context) {
    throw new Error("useFiltros deve ser usado dentro de FiltrosProvider");
  }
  return context;
}
