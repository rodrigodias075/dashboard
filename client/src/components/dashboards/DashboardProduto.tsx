import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Box, DollarSign, Package } from "lucide-react";
import { useFilters } from "@/contexts/FilterContext";

interface DadosVendas {
  uf: string;
  cliente: string;
  produto: string;
  meses: { mes: string; qtde: number; valor: number }[];
}

const MESES_LABELS: Record<string, string> = {
  jan: "Janeiro", fev: "Fevereiro", mar: "Março", abr: "Abril",
  mai: "Maio", jun: "Junho", jul: "Julho", ago: "Agosto",
  set: "Setembro", out: "Outubro", nov: "Novembro", dez: "Dezembro"
};

const CORES_PRODUTOS = [
  "oklch(0.65 0.30 30)", "oklch(0.62 0.25 20)", "oklch(0.58 0.26 240)",
  "oklch(0.68 0.27 60)", "oklch(0.52 0.24 180)", "oklch(0.64 0.26 320)",
  "oklch(0.56 0.25 100)", "oklch(0.61 0.27 200)", "oklch(0.59 0.26 340)",
];

export default function DashboardProduto() {
  const [dados, setDados] = useState<DadosVendas[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedUFs, selectedClientes, selectedMeses, selectedProdutos } = useFilters();

  useEffect(() => {
    fetch("/dados-vendas.json")
      .then(res => res.json())
      .then(data => {
        setDados(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar dados:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent mx-auto mb-4"></div>
          <p className="font-label text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  // Aplicar filtros globais
  const dadosFiltrados = dados.filter(item => {
    if (selectedUFs.length > 0 && !selectedUFs.includes(item.uf)) return false;
    if (selectedClientes.length > 0 && !selectedClientes.includes(item.cliente)) return false;
    if (selectedProdutos.length > 0 && !selectedProdutos.includes(item.produto)) return false;
    return true;
  });

  // Agregar por Produto
  const dadosPorProduto = dadosFiltrados.reduce((acc, item) => {
    if (!acc[item.produto]) {
      acc[item.produto] = { produto: item.produto, meses: {}, total_qtde: 0, total_valor: 0 };
    }
    
    item.meses.forEach(mes => {
      // Filtrar por mês se selecionado
      if (selectedMeses.length > 0 && !selectedMeses.includes(mes.mes)) return;
      
      if (!acc[item.produto].meses[mes.mes]) {
        acc[item.produto].meses[mes.mes] = { mes: mes.mes, qtde: 0, valor: 0 };
      }
      acc[item.produto].meses[mes.mes].qtde += mes.qtde;
      acc[item.produto].meses[mes.mes].valor += mes.valor;
      acc[item.produto].total_qtde += mes.qtde;
      acc[item.produto].total_valor += mes.valor;
    });
    
    return acc;
  }, {} as Record<string, any>);

  const produtosData = Object.values(dadosPorProduto);
  const totalVendas = produtosData.reduce((acc: number, p: any) => acc + p.total_valor, 0);
  const totalItens = produtosData.reduce((acc: number, p: any) => acc + p.total_qtde, 0);
  const mediaTicket = totalItens > 0 ? totalVendas / totalItens : 0;

  const rankingProdutos = [...produtosData]
    .sort((a: any, b: any) => b.total_valor - a.total_valor)
    .slice(0, 10)
    .map((p: any, idx) => ({
      produto: p.produto && p.produto.length > 25 ? p.produto.substring(0, 25) + '...' : p.produto || 'Produto',
      valor: p.total_valor,
      cor: CORES_PRODUTOS[idx % CORES_PRODUTOS.length]
    }));

  const evolucaoMensal = (() => {
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const mesesFiltrados = selectedMeses.length > 0 ? selectedMeses : meses;
    
    return mesesFiltrados.map(mes => {
      const valorTotal = produtosData.reduce((acc: number, produto: any) => {
        const mesData = produto.meses[mes];
        return acc + (mesData?.valor || 0);
      }, 0);
      return {
        mes: MESES_LABELS[mes],
        valor: valorTotal
      };
    });
  })();

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  const formatarNumero = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatarContabil = (valor: number) => {
    if (valor >= 1000000) {
      return (valor / 1000000).toFixed(1).replace('.', ',') + 'M';
    } else if (valor >= 1000) {
      return (valor / 1000).toFixed(1).replace('.', ',') + 'K';
    }
    return valor.toFixed(0);
  };

  const formatarTooltip = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glow-effect bg-gradient-to-br from-accent/10 to-transparent border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-label text-xs uppercase text-muted-foreground">Receita Total</CardTitle>
              <DollarSign className="w-5 h-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-data text-2xl text-foreground">{formatarMoeda(totalVendas)}</div>
          </CardContent>
        </Card>

        <Card className="glow-effect bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20 hover:border-secondary/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-label text-xs uppercase text-muted-foreground">Total de Itens</CardTitle>
              <Package className="w-5 h-5 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-data text-2xl text-foreground">{formatarNumero(totalItens)}</div>
          </CardContent>
        </Card>

        <Card className="glow-effect bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-label text-xs uppercase text-muted-foreground">Ticket Médio</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-data text-2xl text-foreground">{formatarMoeda(mediaTicket)}</div>
          </CardContent>
        </Card>

        <Card className="glow-effect bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20 hover:border-destructive/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-label text-xs uppercase text-muted-foreground">Produtos</CardTitle>
              <Box className="w-5 h-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-data text-2xl text-foreground">{produtosData.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="evolucao" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="evolucao">Evolução Mensal</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>

        <TabsContent value="evolucao" className="mt-6">
          <Card className="glow-effect">
            <CardHeader>
              <CardTitle className="font-display text-xl">Evolução Temporal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={evolucaoMensal}>
                  <defs>
                    <linearGradient id="colorValor3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.65 0.30 30)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="oklch(0.65 0.30 30)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 280 / 0.2)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="oklch(0.50 0.02 280)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.50 0.02 280)" tickFormatter={formatarContabil} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={formatarTooltip} />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="oklch(0.65 0.30 30)" 
                    strokeWidth={3}
                    dot={{ fill: 'oklch(0.65 0.30 30)', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <Card className="glow-effect">
            <CardHeader>
              <CardTitle className="font-display text-xl">Top 10 Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={rankingProdutos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 280 / 0.2)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.50 0.02 280)" tickFormatter={formatarContabil} />
                  <YAxis type="category" dataKey="produto" tick={{ fontSize: 11 }} stroke="oklch(0.50 0.02 280)" width={150} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={formatarTooltip} />
                  <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                    {rankingProdutos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
