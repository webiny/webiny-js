import { createContext, useContext } from "react";
import type { ListViewContextValue } from "./types.js";

const ListViewContext = createContext<ListViewContextValue | undefined>(undefined);

export const ListViewProvider = ListViewContext.Provider;

export function useListView(): ListViewContextValue {
    const ctx = useContext(ListViewContext);
    if (!ctx) {
        throw new Error("useListView() must be used within a <ListView> component.");
    }
    return ctx;
}
