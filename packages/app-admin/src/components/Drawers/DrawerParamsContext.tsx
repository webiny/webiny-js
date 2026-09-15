import { createContext, useContext } from "react";

export interface DrawerParamsContextValue {
    params: Record<string, unknown>;
    closeDrawer: () => void;
}

export const DrawerParamsContext = createContext<DrawerParamsContextValue | undefined>(undefined);

export const useDrawerParamsContext = () => {
    const context = useContext(DrawerParamsContext);

    if (!context) {
        throw new Error(
            "useDrawer must be used inside a named drawer registered via AdminConfig.Drawer"
        );
    }

    return context;
};
