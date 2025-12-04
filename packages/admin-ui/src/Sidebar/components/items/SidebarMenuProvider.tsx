import React from "react";

interface SidebarMenuContext {
    currentLevel: number;
    nextLevel: number;
    parentIcon?: React.ReactNode;
}

interface SidebarMenuProviderProps {
    level?: number;
    parentIcon?: React.ReactNode;
    children: React.ReactNode;
}

const SidebarMenuContext = React.createContext<SidebarMenuContext>({
    currentLevel: 0,
    nextLevel: 1,
    parentIcon: undefined
});

function useSidebarMenu() {
    const context = React.useContext(SidebarMenuContext);
    if (!context) {
        throw new Error("useSidebarItem must be used within a SidebarMenuProvider.");
    }

    return context;
}

const SidebarMenuProvider = ({ level = 0, parentIcon, children }: SidebarMenuProviderProps) => {
    return (
        <SidebarMenuContext.Provider value={{ currentLevel: level, nextLevel: level + 1, parentIcon }}>
            {children}
        </SidebarMenuContext.Provider>
    );
};

SidebarMenuProvider.displayName = "SidebarMenuProvider";

export { SidebarMenuProvider, useSidebarMenu };
