import { createContext, useContext, useState, ReactNode } from "react";

interface FilterContextType {
  selectedUFs: string[];
  setSelectedUFs: (ufs: string[]) => void;
  selectedClientes: string[];
  setSelectedClientes: (clientes: string[]) => void;
  selectedMeses: string[];
  setSelectedMeses: (meses: string[]) => void;
  selectedProdutos: string[];
  setSelectedProdutos: (produtos: string[]) => void;
  clearAllFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [selectedUFs, setSelectedUFs] = useState<string[]>([]);
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [selectedMeses, setSelectedMeses] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);

  const clearAllFilters = () => {
    setSelectedUFs([]);
    setSelectedClientes([]);
    setSelectedMeses([]);
    setSelectedProdutos([]);
  };

  return (
    <FilterContext.Provider
      value={{
        selectedUFs,
        setSelectedUFs,
        selectedClientes,
        setSelectedClientes,
        selectedMeses,
        setSelectedMeses,
        selectedProdutos,
        setSelectedProdutos,
        clearAllFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
