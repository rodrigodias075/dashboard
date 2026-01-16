/**
 * Dashboard de Vendas Multi-Perspectiva
 * Design: Maximalismo Cartográfico com cores vibrantes e animações
 * Três perspectivas: UF, Cliente, Produto
 * Tema: Light/Dark com toggle
 */

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import DashboardUF from "@/components/dashboards/DashboardUF";
import DashboardCliente from "@/components/dashboards/DashboardCliente";
import DashboardProduto from "@/components/dashboards/DashboardProduto";
import GlobalFilters from "@/components/GlobalFilters";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header com toggle de tema */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-jkg.png" alt="JKG do Brasil" className="h-12 w-auto" />
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                JKG do Brasil
              </h1>
              <p className="font-label text-xs text-muted-foreground">
                Análise Multi-Perspectiva de Vendas
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo principal com abas */}
      <main className="container py-8">
        {/* Filtros Globais */}
        <GlobalFilters />
        
        <div className="h-6" />
        <Tabs defaultValue="uf" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8 bg-muted p-1 rounded-lg">
            <TabsTrigger 
              value="uf"
              className="font-label font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200"
            >
              Por UF
            </TabsTrigger>
            <TabsTrigger 
              value="cliente"
              className="font-label font-semibold data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all duration-200"
            >
              Por Cliente
            </TabsTrigger>
            <TabsTrigger 
              value="produto"
              className="font-label font-semibold data-[state=active]:bg-accent data-[state=active]:text-accent-foreground transition-all duration-200"
            >
              Por Produto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uf" className="animate-slide-up">
            <DashboardUF />
          </TabsContent>

          <TabsContent value="cliente" className="animate-slide-up">
            <DashboardCliente />
          </TabsContent>

          <TabsContent value="produto" className="animate-slide-up">
            <DashboardProduto />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container py-6">
          <p className="font-label text-xs text-center text-muted-foreground">
            Dashboard de Análise Comercial • Dados Consolidados 2024
          </p>
        </div>
      </footer>
    </div>
  );
}
