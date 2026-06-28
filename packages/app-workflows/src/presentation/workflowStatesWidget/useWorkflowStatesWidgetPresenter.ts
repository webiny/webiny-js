import React, { createContext, useContext } from "react";
import type { IWorkflowStatesWidgetPresenter } from "./abstractions.js";

const PresenterContext = createContext<IWorkflowStatesWidgetPresenter | null>(null);

export interface ProviderProps {
    presenter: IWorkflowStatesWidgetPresenter;
    children: React.ReactNode;
}

export const WorkflowStatesWidgetPresenterProvider = ({ presenter, children }: ProviderProps) => {
    return React.createElement(PresenterContext.Provider, { value: presenter }, children);
};

export const useWorkflowStatesWidgetPresenter = (): IWorkflowStatesWidgetPresenter => {
    const presenter = useContext(PresenterContext);
    if (!presenter) {
        throw new Error(
            "useWorkflowStatesWidgetPresenter must be used within a WorkflowStatesWidgetPresenterProvider."
        );
    }
    return presenter;
};
