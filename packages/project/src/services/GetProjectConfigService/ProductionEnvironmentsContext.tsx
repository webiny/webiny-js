import React, { createContext, useContext, useState } from "react";

interface ProductionEnvironmentsContextValue {
    prodEnvs: string[];
    setProdEnvs: React.Dispatch<React.SetStateAction<string[]>>;
}

const ProductionEnvironmentsContext = createContext<ProductionEnvironmentsContextValue | null>(
    null
);

export const ProductionEnvironmentsCollector: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const [prodEnvs, setProdEnvs] = useState<string[]>([]);
    return (
        <ProductionEnvironmentsContext.Provider value={{ prodEnvs, setProdEnvs }}>
            {children}
        </ProductionEnvironmentsContext.Provider>
    );
};

export const useProductionEnvironments = (): string[] => {
    return useContext(ProductionEnvironmentsContext)?.prodEnvs ?? [];
};

export const useRegisterProductionEnvironments = () => {
    return useContext(ProductionEnvironmentsContext)?.setProdEnvs ?? null;
};
