/**
 * Utilitários para manipulação de datas evitando problemas de timezone
 * 
 * Problema: Quando a API retorna uma data ISO como "2026-02-04",
 * new Date() interpreta como UTC meia-noite. Ao converter para
 * timezone local (ex: Brasil UTC-3), a data "volta" um dia.
 */

/**
 * Formata uma data ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
 * sem problemas de timezone
 */
export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return "-";
  
  // Remove a parte de hora se existir e pega apenas YYYY-MM-DD
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  
  if (!year || !month || !day) return "-";
  
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

/**
 * Converte uma string de data ISO para um objeto Date local (meia-noite)
 * sem shift de timezone
 */
export function parseLocalDate(dateStr: string | undefined | null): Date | undefined {
  if (!dateStr) return undefined;
  
  const datePart = dateStr.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  
  if (!year || !month || !day) return undefined;
  
  // Cria a data no timezone local, não UTC
  return new Date(year, month - 1, day);
}

/**
 * Calcula a diferença em dias entre duas datas (ignora horário)
 */
export function diffInDays(date1: Date, date2: Date): number {
  // Normaliza ambas as datas para meia-noite
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
