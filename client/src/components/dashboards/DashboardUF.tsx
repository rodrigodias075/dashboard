import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, MapPin, DollarSign, Package } from "lucide-react";
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

const CORES_ESTADOS = [
  "oklch(0.55 0.25 280)", "oklch(0.60 0.28 140)", "oklch(0.65 0.30 30)",
  "oklch(0.62 0.25 20)", "oklch(0.58 0.26 240)", "oklch(0.68 0.27 60)",
  "oklch(0.52 0.24 180)", "oklch(0.64 0.26 320)", "oklch(0.56 0.25 100)",
  "oklch(0.61 0.27 200)", "oklch(0.59 0.26 340)", "oklch(0.63 0.25 120)",
  "oklch(0.57 0.26 260)", "oklch(0.66 0.28 40)", "oklch(0.54 0.24 160)",
  "oklch(0.65 0.27 80)", "oklch(0.58 0.25 220)", "oklch(0.62 0.26 300)",
  "oklch(0.55 0.27 140)", "oklch(0.64 0.25 20)", "oklch(0.60 0.26 180)"
];

export default function DashboardUF() {
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
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

  // Agregar por UF
  const dadosPorUF = dadosFiltrados.reduce((acc, item) => {
    if (!acc[item.uf]) {
      acc[item.uf] = { uf: item.uf, meses: {}, total_qtde: 0, total_valor: 0 };
    }
    
    item.meses.forEach(mes => {
      // Filtrar por mês se selecionado
      if (selectedMeses.length > 0 && !selectedMeses.includes(mes.mes)) return;
      
      if (!acc[item.uf].meses[mes.mes]) {
        acc[item.uf].meses[mes.mes] = { mes: mes.mes, qtde: 0, valor: 0 };
      }
      acc[item.uf].meses[mes.mes].qtde += mes.qtde;
      acc[item.uf].meses[mes.mes].valor += mes.valor;
      acc[item.uf].total_qtde += mes.qtde;
      acc[item.uf].total_valor += mes.valor;
    });
    
    return acc;
  }, {} as Record<string, any>);

  const estadosData = Object.values(dadosPorUF);
  const totalVendas = estadosData.reduce((acc: number, e: any) => acc + e.total_valor, 0);
  const totalItens = estadosData.reduce((acc: number, e: any) => acc + e.total_qtde, 0);
  const mediaTicket = totalItens > 0 ? totalVendas / totalItens : 0;

  const rankingEstados = [...estadosData]
    .sort((a: any, b: any) => b.total_valor - a.total_valor)
    .slice(0, 10)
    .map((e: any, idx) => ({
      uf: e.uf,
      valor: e.total_valor,
      cor: CORES_ESTADOS[idx % CORES_ESTADOS.length]
    }));

  const evolucaoMensal = (() => {
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const mesesFiltrados = selectedMeses.length > 0 ? selectedMeses : meses;
    
    return mesesFiltrados.map(mes => {
      const valorTotal = estadosData.reduce((acc: number, estado: any) => {
        const mesData = estado.meses[mes];
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
        <Card className="glow-effect bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:border-primary/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-label text-xs uppercase text-muted-foreground">Receita Total</CardTitle>
              <DollarSign className="w-5 h-5 text-primary" />
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

        <Card className="glow-effect bg-gradient-to-br from-accent/10 to-transparent border-accent/20 hover:border-accent/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-label text-xs uppercase text-muted-foreground">Ticket Médio</CardTitle>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-data text-2xl text-foreground">{formatarMoeda(mediaTicket)}</div>
          </CardContent>
        </Card>

        <Card className="glow-effect bg-gradient-to-br from-destructive/10 to-transparent border-destructive/20 hover:border-destructive/40 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-label text-xs uppercase text-muted-foreground">Estados</CardTitle>
              <MapPin className="w-5 h-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="font-data text-2xl text-foreground">{estadosData.length}</div>
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
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.25 280)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="oklch(0.55 0.25 280)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 280 / 0.2)" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="oklch(0.50 0.02 280)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.50 0.02 280)" tickFormatter={formatarContabil} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={formatarTooltip} />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="oklch(0.55 0.25 280)" 
                    strokeWidth={3}
                    dot={{ fill: 'oklch(0.55 0.25 280)', r: 5 }}
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
              <CardTitle className="font-display text-xl">Top 10 Estados</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={rankingEstados} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.02 280 / 0.2)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.50 0.02 280)" tickFormatter={formatarContabil} />
                  <YAxis type="category" dataKey="uf" tick={{ fontSize: 12, fontWeight: 600 }} stroke="oklch(0.50 0.02 280)" width={50} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} formatter={formatarTooltip} />
                  <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                    {rankingEstados.map((entry, index) => (
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
