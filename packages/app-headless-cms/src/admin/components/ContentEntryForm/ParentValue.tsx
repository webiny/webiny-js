import React, { createContext, useContext } from "react";

interface ParentValue {
    value: any;
    getParentValue(level: number): any;
}

const ParentValue = createContext<ParentValue | undefined>(undefined);

export function useParentField(level = 0): ParentValue | undefined {
    const parent = useContext(ParentValue);

    if (!parent) {
        return undefined;
    }

    const value = level === 0 ? parent.value : parent.getParentValue(level);

    return {
        value,
        getParentValue: (level = 0) => {
            return parent.getParentValue(level);
        }
    };
}

interface ParentValueProviderProps {
    value: any;
    name?: string;
    children: React.ReactNode;
}

export const ParentValueProvider = ({ name, value, children }: ParentValueProviderProps) => {
    const parent = useContext(ParentValue);

    const getParentValue = (level = 0) => {
        return parent ? (level === 0 ? parent.value : parent.getParentValue(level - 1)) : undefined;
    };

    const context = { value, getParentValue };

    return (
        <div style={{ border: "1px dashed red", padding: 5 }}>
            {name || null}
            <ParentValue.Provider value={context}>{children}</ParentValue.Provider>
        </div>
    );
};
