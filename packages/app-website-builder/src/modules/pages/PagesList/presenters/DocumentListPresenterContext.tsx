import React, { createContext, useContext, useMemo } from "react";
import { DocumentListPresenter } from "./DocumentListPresenter.js";
import { makeDecoratableHook } from "@webiny/react-composition";

const DocumentListPresenterContext = createContext<DocumentListPresenter | null>(null);

interface IDocumentListPresenterProviderProps {
    children: React.ReactNode;
}

export const DocumentListPresenterProvider = ({
    children
}: IDocumentListPresenterProviderProps) => {
    const presenter = useMemo(() => new DocumentListPresenter(), []);
    return (
        <DocumentListPresenterContext.Provider value={presenter}>
            {children}
        </DocumentListPresenterContext.Provider>
    );
};

export const useDocumentListPresenter = makeDecoratableHook(() => {
    const presenter = useContext(DocumentListPresenterContext);
    if (!presenter) {
        throw new Error(
            "useDocumentListPresenter must be used within a DocumentListPresenterProvider"
        );
    }
    return presenter;
});
