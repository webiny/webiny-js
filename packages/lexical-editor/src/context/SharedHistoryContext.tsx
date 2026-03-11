import * as React from "react";
import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import type { HistoryState } from "@lexical/history";
import { createEmptyHistoryState } from "@lexical/history";

type ContextShape = {
    historyState?: HistoryState;
};

const Context: React.Context<ContextShape> = createContext({});

export const SharedHistoryContext = ({ children }: { children: ReactNode }): React.JSX.Element => {
    const historyContext = useMemo(() => ({ historyState: createEmptyHistoryState() }), []);
    return <Context.Provider value={historyContext}>{children}</Context.Provider>;
};

export const useSharedHistoryContext = (): ContextShape => {
    return useContext(Context);
};
