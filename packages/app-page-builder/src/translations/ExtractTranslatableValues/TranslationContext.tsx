import React, { useMemo, useRef } from "react";
import { GenericRecord } from "@webiny/app/types";

export interface TranslatableItem {
    collectionId: string;
    itemId: string;
    value: any;
    context?: GenericRecord<string>;
}

export interface TranslationContext {
    getTranslationItems: () => TranslatableItem[];
    setTranslationItem: (item: TranslatableItem) => void;
}

const TranslationContext = React.createContext<TranslationContext | undefined>(undefined);

interface TranslationProviderProps {
    children: React.ReactNode;
}

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
    const translationItemsRef = useRef(new Map<string, TranslatableItem>());

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
