import React, { useState, createContext } from "react";
import { DropDestination, FbFormModelField } from "~/types";

interface FormStepContextParams {
    editingField: FbFormModelField | null;
    dropDestination: DropDestination | null;
    setEditingField: (field: FbFormModelField | null) => void;
    setDropDestination: (dropTarget: DropDestination | null) => void;
}

export const FormStepContext = createContext<FormStepContextParams>({
    editingField: null,
    dropDestination: null,
    setEditingField: () => null,
    setDropDestination: () => null
});

interface FormStepContextProviderProps {
    children: React.ReactNode;
}

export const FormStepContextProvider = ({ children }: FormStepContextProviderProps) => {
    const [editingField, setEditingField] = useState<FbFormModelField | null>(null);
    const [dropDestination, setDropDestination] = useState<DropDestination | null>(null);

    const providerValue = {
        editingField,
        dropDestination,
        setEditingField,
        setDropDestination
    } as FormStepContextParams;

    return <FormStepContext.Provider value={providerValue}>{children}</FormStepContext.Provider>;
};
