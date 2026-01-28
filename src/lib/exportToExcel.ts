import * as XLSX from 'xlsx';
import type { VendaItem } from '@/types/venda';

function formatarDados(item: VendaItem) {
  return {
    Data: item.Data,
    Empresa: item.Empresa,
    Nota: item.Nota,
    'Tipo Movimento': item['Tipo Movimento'],
    'Cód. Cli': item['Cód. Cli'],
    Cliente: item.Cliente,
    'Cód. Prod': item['Cód. Prod'],
    Produto: item.Produto,
    'Quant.': item['Quant.'],
    'Valor Unit.': item['Valor Unit.'],
    'Desconto.': item['Desconto.'],
    'Total Desc.': item['Total Desc.'],
    'Total NF': item['Total NF'],
    'Total Merc.': item['Total Merc.'],
    'Vlr.ICM': item['Vlr.ICM'],
    'Part.Dest.': item['Part.Dest.'],
    'Vlr.Pis/Cofins': item['Vlr.Pis/Cofins'],
    'Vlr.Frete': item['Vlr.Frete'],
    'Vlr.Comissão': item['Vlr.Comissão'],
    'Vlr.ZF': item['Vlr.ZF'],
    'Vlr.Líquido': item['Vlr.Líquido'],
    'Vlr.CMV': item['Vlr.CMV'],
    '$ Margem': item['$ Margem'],
    'Mg.Líq': item['Mg.Líq'],
    'Mg.Bruta': item['Mg.Bruta'],
    'Vlr.IPI': item['Vlr.IPI'],
    Categoria: item.Categoria,
    Atividade: item.Atividade,
    Região: item.Região,
    Grupo: item.Grupo,
    Subgrupo: item.Subgrupo,
    Vendedor: item.Vendedor,
    Equipe: item.Equipe,
    CFOP: item.CFOP,
    UF: item.UF,
    Cidade: item.Cidade,
    Mês: item.Mês,
    Ano: item.Ano,
    Estoque: item.Estoque,
    Marca: item.Marca,
  };
}

function criarLinhaTotal(dados: VendaItem[], tipoLinha: 'VENDAS' | 'DEVOLUÇÕES' = 'VENDAS') {
  const isDevOlucao = tipoLinha === 'DEVOLUÇÕES';
  
  return {
    Data: 'TOTAL',
    Empresa: '',
    Nota: '',
    'Tipo Movimento': '',
    'Cód. Cli': '',
    Cliente: '',
    'Cód. Prod': '',
    Produto: '',
    'Quant.': dados.reduce((sum, item) => sum + (item['Quant.'] || 0), 0),
    'Valor Unit.': '',
    'Desconto.': '',
    'Total Desc.': dados.reduce((sum, item) => sum + (item['Total Desc.'] || 0), 0),
    'Total NF': isDevOlucao 
      ? Math.abs(dados.reduce((sum, item) => sum + (item['Total NF'] || 0), 0))
      : dados.reduce((sum, item) => sum + (item['Total NF'] || 0), 0),
    'Total Merc.': dados.reduce((sum, item) => sum + (item['Total Merc.'] || 0), 0),
    'Vlr.ICM': dados.reduce((sum, item) => sum + (item['Vlr.ICM'] || 0), 0),
    'Part.Dest.': dados.reduce((sum, item) => sum + (item['Part.Dest.'] || 0), 0),
    'Vlr.Pis/Cofins': dados.reduce((sum, item) => sum + (item['Vlr.Pis/Cofins'] || 0), 0),
    'Vlr.Frete': dados.reduce((sum, item) => sum + (item['Vlr.Frete'] || 0), 0),
    'Vlr.Comissão': dados.reduce((sum, item) => sum + (item['Vlr.Comissão'] || 0), 0),
    'Vlr.ZF': dados.reduce((sum, item) => sum + (item['Vlr.ZF'] || 0), 0),
    'Vlr.Líquido': dados.reduce((sum, item) => sum + (item['Vlr.Líquido'] || 0), 0),
    'Vlr.CMV': Math.abs(dados.reduce((sum, item) => sum + (item['Vlr.CMV'] || 0), 0)),
    '$ Margem': dados.reduce((sum, item) => sum + (item['$ Margem'] || 0), 0),
    'Mg.Líq': dados.reduce((sum, item) => sum + (item['Mg.Líq'] || 0), 0),
    'Mg.Bruta': dados.reduce((sum, item) => sum + (item['Mg.Bruta'] || 0), 0),
    'Vlr.IPI': dados.reduce((sum, item) => sum + (item['Vlr.IPI'] || 0), 0),
    Categoria: '',
    Atividade: '',
    Região: '',
    Grupo: '',
    Subgrupo: '',
    Vendedor: '',
    Equipe: '',
    CFOP: '',
    UF: '',
    Cidade: '',
    Mês: '',
    Ano: '',
    Estoque: '',
    Marca: '',
  };
}

export function exportarVendasExcel(
  dados: VendaItem[],
  nomeArquivo: string = 'vendas.xlsx'
) {
  if (dados.length === 0) {
    alert('Nenhum dado para exportar');
    return;
  }

  // Separa vendas de devoluções
  const vendas = dados.filter((item) => !item["Tipo Movimento"]?.toLowerCase().includes("devolução"));
  const devolucoes = dados.filter((item) => item["Tipo Movimento"]?.toLowerCase().includes("devolução"));

  // Formata dados das vendas
  const vendasFormatadas = vendas.map(formatarDados);
  const vendasComTotal = [...vendasFormatadas, criarLinhaTotal(vendas, 'VENDAS')];

  // Formata dados das devoluções
  const devolucoesDados = devolucoes.length > 0 ? devolucoes.map(formatarDados) : [];
  const devolucoesComTotal = devolucoes.length > 0 
    ? [...devolucoesDados, criarLinhaTotal(devolucoes, 'DEVOLUÇÕES')] 
    : devolucoesDados;

  // Cria a workbook
  const workbook = XLSX.utils.book_new();

  // Sheet de Vendas
  const worksheetVendas = XLSX.utils.json_to_sheet(vendasComTotal);
  const colWidths = vendasFormatadas.length > 0 ? Object.keys(vendasFormatadas[0]).map(() => 15) : [];
  worksheetVendas['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(workbook, worksheetVendas, 'Vendas');

  // Sheet de Devoluções (se houver)
  if (devolucoes.length > 0) {
    const worksheetDevolucoes = XLSX.utils.json_to_sheet(devolucoesComTotal);
    worksheetDevolucoes['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, worksheetDevolucoes, 'Devoluções');
  }

  // Salva o arquivo
  XLSX.writeFile(workbook, nomeArquivo);
}
