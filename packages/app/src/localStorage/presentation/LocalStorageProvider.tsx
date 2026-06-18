import React from "react";
import type { ILocalStorage } from "~/localStorage/feature/abstractions.js";
import { useMemo } from "react";
import { createLocalStorage } from "~/localStorage/feature/feature.js";
import { useContext } from "react";

export interface LocalStorageProviderProps {
    children: React.ReactNode;
    prefix?: string;
}

export interface LocalStorageContext {
    prefix: string;
    localStorage: ILocalStorage;
}

const LocalStorageContext = React.createContext<LocalStorageContext | undefined>(undefined);

export const LocalStorageProvider = ({ prefix, children }: LocalStorageProviderProps) => {
    const parent = useContext(LocalStorageContext);
    const newPrefix = [parent?.prefix, prefix].filter(Boolean).join("/");

    const localStorage = useMemo(() => createLocalStorage({ prefix: newPrefix }), [newPrefix]);

    return (
        <LocalStorageContext.Provider value={{ prefix: newPrefix, localStorage }}>
            {children}
        </LocalStorageContext.Provider>
    );
};

export const useLocalStorage = () => {
    const context = useContext(LocalStorageContext);
    if (!context) {
        throw new Error("useLocalStorage must be used within LocalStorageProvider");
    }

    return context;
};
