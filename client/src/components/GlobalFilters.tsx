import { useEffect, useState } from "react";
import { useFilters } from "@/contexts/FilterContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ChevronsUpDown, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function GlobalFilters() {
  const {
    selectedUFs,
    setSelectedUFs,
    selectedClientes,
    setSelectedClientes,
    selectedMeses,
    setSelectedMeses,
    selectedProdutos,
    setSelectedProdutos,
    clearAllFilters,
  } = useFilters();

  const [dados, setDados] = useState<DadosVendas[]>([]);
  const [openClientes, setOpenClientes] = useState(false);
  const [searchCliente, setSearchCliente] = useState("");

  useEffect(() => {
    fetch("/dados-vendas.json")
      .then(res => res.json())
      .then(data => setDados(data))
      .catch(err => console.error("Erro ao carregar dados:", err));
  }, []);

  // Extrair listas únicas
  const ufsDisponiveis = Array.from(new Set(dados.map(d => d.uf))).sort();
  
  // Clientes dependem da UF selecionada
  const clientesDisponiveis = Array.from(
    new Set(
      dados
        .filter(d => selectedUFs.length === 0 || selectedUFs.includes(d.uf))
        .map(d => d.cliente)
    )
  ).sort();
  
  const produtosDisponiveis = Array.from(new Set(dados.map(d => d.produto))).sort();
  
  // Extrair meses que realmente existem nos dados
  const mesesEmDados = Array.from(
    new Set(dados.flatMap(d => d.meses.map(m => m.mes)))
  ).sort((a, b) => {
    const ordem = { jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12 };
    return (ordem[a as keyof typeof ordem] || 0) - (ordem[b as keyof typeof ordem] || 0);
  });
  
  const mesesDisponiveis = mesesEmDados.map(mes => [mes, MESES_LABELS[mes]] as [string, string]);


  // Filtrar clientes pela busca
  const clientesFiltrados = clientesDisponiveis.filter(cliente =>
    cliente && cliente.toLowerCase().includes(searchCliente.toLowerCase())
  );

  const toggleCliente = (cliente: string) => {
    setSelectedClientes(
      selectedClientes.includes(cliente)
        ? selectedClientes.filter(c => c !== cliente)
        : [...selectedClientes, cliente]
    );
  };

  // Quando UF muda, limpar clientes selecionados que não existem mais naquela UF
  useEffect(() => {
    if (selectedUFs.length > 0) {
      const clientesValidos = selectedClientes.filter(c =>
        dados.some(d => d.uf === selectedUFs[0] && d.cliente === c)
      );
      if (clientesValidos.length !== selectedClientes.length) {
        setSelectedClientes(clientesValidos);
      }
    }
  }, [selectedUFs, selectedClientes, dados]);

  const removeCliente = (cliente: string) => {
    setSelectedClientes(selectedClientes.filter(c => c !== cliente));
  };

  const hasActiveFilters = 
    selectedUFs.length > 0 || 
    selectedClientes.length > 0 || 
    selectedMeses.length > 0 || 
    selectedProdutos.length > 0;

  return (
    <div className="space-y-4 p-6 bg-card rounded-lg border border-border shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-label text-sm font-semibold text-foreground uppercase">Filtros Globais</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <XCircle className="w-4 h-4 mr-1" />
            Limpar Todos
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtro de UF */}
        <div className="space-y-2">
          <label className="font-label text-xs text-muted-foreground uppercase">Estado (UF)</label>
          <Select
            value={selectedUFs[0] || "todos"}
            onValueChange={(value) => setSelectedUFs(value === "todos" ? [] : [value])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os Estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Estados</SelectItem>
              {ufsDisponiveis.map(uf => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Clientes (Multi-select com busca) */}
        <div className="space-y-2">
          <label className="font-label text-xs text-muted-foreground uppercase">Clientes</label>
          <Popover open={openClientes} onOpenChange={setOpenClientes}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openClientes}
                className="w-full justify-between font-normal"
              >
                {selectedClientes.length > 0
                  ? `${selectedClientes.length} selecionado(s)`
                  : "Todos os Clientes"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Buscar cliente..." 
                  value={searchCliente}
                  onValueChange={setSearchCliente}
                />
                <CommandList>
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup>
                    {clientesFiltrados.map((cliente) => (
                      <CommandItem
                        key={cliente}
                        value={cliente}
                        onSelect={() => toggleCliente(cliente)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedClientes.includes(cliente) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate">{cliente}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Filtro de Mês */}
        <div className="space-y-2">
          <label className="font-label text-xs text-muted-foreground uppercase">Mês</label>
          <Select
            value={selectedMeses[0] || "todos"}
            onValueChange={(value) => setSelectedMeses(value === "todos" ? [] : [value])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os Meses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Meses</SelectItem>
              {mesesDisponiveis.map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtro de Produto */}
        <div className="space-y-2">
          <label className="font-label text-xs text-muted-foreground uppercase">Produto</label>
          <Select
            value={selectedProdutos[0] || "todos"}
            onValueChange={(value) => setSelectedProdutos(value === "todos" ? [] : [value])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos os Produtos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Produtos</SelectItem>
              {produtosDisponiveis.map(produto => (
                <SelectItem key={produto} value={produto}>{produto}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Badges de clientes selecionados */}
      {selectedClientes.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedClientes.map(cliente => (
            <Badge
              key={cliente}
              variant="secondary"
              className="pl-3 pr-1 py-1 text-xs font-normal"
            >
              <span className="max-w-[200px] truncate">{cliente}</span>
              <button
                onClick={() => removeCliente(cliente)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
