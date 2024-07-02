import React, { useMemo, useRef } from "react";

interface TranslationItem {
    collection: string;
    itemId: string;
    source: any;
    context?: Record<string, any>;
}

export interface TranslationContext {
    getTranslationItems: () => TranslationItem[];
    setTranslationItem: (item: TranslationItem) => void;
}

const TranslationContext = React.createContext<TranslationContext | undefined>(undefined);

interface TranslationProviderProps {
    children: React.ReactNode;
}

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
    const translationItemsRef = useRef(new Map<string, TranslationItem>());

    const context = useMemo<TranslationContext>(
        () => ({
            getTranslationItems: () => {
                return Array.from(translationItemsRef.current.values());
            },
            setTranslationItem: item => {
                if (!translationItemsRef.current) {
                    return;
                }

                translationItemsRef.current.set(item.itemId, item);
            }
        }),
        []
    );

    return <TranslationContext.Provider value={context}>{children}</TranslationContext.Provider>;
};

export function useTranslations() {
    return React.useContext(TranslationContext);
}
