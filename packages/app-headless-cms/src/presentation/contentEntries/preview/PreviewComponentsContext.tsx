import React, { createContext, useContext, useState, useCallback } from "react";

export interface PreviewComponent {
    name: string;
    label: string;
    description: string;
}

interface PreviewComponentsContextValue {
    components: PreviewComponent[];
    addComponent: (component: PreviewComponent) => void;
}

const ComponentsContext = createContext<PreviewComponentsContextValue | undefined>(undefined);

const EMPTY_COMPONENTS: PreviewComponent[] = [];
const NO_OP = () => {
    return;
};

export const usePreviewComponents = () => {
    const context = useContext(ComponentsContext);

    if (!context) {
        return { components: EMPTY_COMPONENTS, addComponent: NO_OP };
    }

    return context;
};

interface PreviewComponentsProviderProps {
    children: React.ReactNode;
}

export const PreviewComponentsProvider = ({ children }: PreviewComponentsProviderProps) => {
    const [components, setComponents] = useState<PreviewComponent[]>([]);

    const addComponent = useCallback((component: PreviewComponent) => {
        setComponents(prev => {
            const exists = prev.some(c => c.name === component.name);
            if (exists) {
                return prev.map(c => (c.name === component.name ? component : c));
            }
            return [...prev, component];
        });
    }, []);

    return (
        <ComponentsContext.Provider value={{ components, addComponent }}>
            {children}
        </ComponentsContext.Provider>
    );
};
