import React from "react";
import { useFormEditorFactory } from "./useFormEditorFactory";
import { FbFormModel } from "~/types";
import { ApolloClient } from "apollo-client";

export interface FormEditorProviderProps {
    id: string;
    defaultLayoutRenderer: string;
    apollo: ApolloClient<any>;
    children: React.ReactNode;
}
export interface FormEditorFieldError {
    label: string;
    fieldId: string;
    index: string;
    errors: {
        [key: string]: string;
    };
}
export interface FormEditorReducerState extends FormEditorProviderProps {
    data: FbFormModel;
    errors: FormEditorFieldError[] | null;
}

const reducerInit = (props: FormEditorReducerState) => {
    return {
        ...props
    };
};

export interface FormEditorReducerAction {
    data?: FbFormModel;
    errors?: FormEditorFieldError[];
    type: "data" | "errors";
}

export interface FormEditorReducer {
    (prev: FormEditorReducerState, action: FormEditorReducerAction): FormEditorReducerState;
}

const formEditorReducer: FormEditorReducer = (state, action) => {
    const next: FormEditorReducerState = {
        ...state
    };
    switch (action.type) {
        case "data": {
            next.errors = null;
            next.data = action.data as FbFormModel;
            break;
        }
        case "errors": {
            next.errors = action.errors || [];
            break;
        }
    }

    return next;
};

export type FormEditorProviderContextState = FormEditorReducerState;
const FormEditorContext = React.createContext<FormEditorProviderContext>({
    state: null as unknown as FormEditorReducerState,
    dispatch: () => {
        return void 0;
    }
});

export interface FormEditorProviderContext {
    state: FormEditorReducerState;
    dispatch: (action: FormEditorReducerAction) => void;
}

export const FormEditorProvider = (props: FormEditorProviderProps) => {
    const [state, dispatch] = React.useReducer<FormEditorReducer, any>(
        formEditorReducer,
        {
            ...props,
            data: null,
            errors: null
        },
        reducerInit
    );

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    }, [state, state.data, state.errors]);

    return <FormEditorContext.Provider value={value} {...props} />;
};

export const useFormEditor = useFormEditorFactory(FormEditorContext);
