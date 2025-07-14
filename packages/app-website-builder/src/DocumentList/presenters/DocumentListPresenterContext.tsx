import React, { createContext, useContext, useMemo } from "react";
import { DocumentListPresenter } from "./DocumentListPresenter";

const DocumentListPresenterContext = createContext<DocumentListPresenter | null>(null);

export const DocumentListPresenterProvider: React.FC<{ children: React.ReactNode }> = ({
    children
}) => {
    const presenter = useMemo(() => new DocumentListPresenter(), []);
    return (
        <DocumentListPresenterContext.Provider value={presenter}>
            {children}
        </DocumentListPresenterContext.Provider>
    );
};

export function useDocumentListPresenter() {
    const presenter = useContext(DocumentListPresenterContext);
    if (!presenter) {
        throw new Error(
            "useDocumentListPresenter must be used within a DocumentListPresenterProvider"
        );
    }
    return presenter;
}
