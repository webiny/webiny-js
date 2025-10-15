import React, { createContext, useContext, ReactNode } from "react";

type AreaName = "header" | "footer";

interface ActionsAreaContextValue {
    areaName: AreaName;
}

const ActionsAreaContext = createContext<ActionsAreaContextValue | undefined>(undefined);

interface ActionsAreaProviderProps {
    areaName: AreaName;
    children: ReactNode;
}

export const ActionsAreaProvider = ({ areaName, children }: ActionsAreaProviderProps) => {
    return (
        <ActionsAreaContext.Provider value={{ areaName }}>
            {children}
        </ActionsAreaContext.Provider>
    );
};

export const useActionsAreaProvider = (): ActionsAreaContextValue => {
    const context = useContext(ActionsAreaContext);
    if (!context) {
        throw new Error("useActionsAreaProvider must be used within ActionsAreaProvider");
    }
    return context;
};

