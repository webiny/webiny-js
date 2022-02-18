import React from "react";
import { useFormEditorFactory } from "./useFormEditorFactory";
import { FbFormModel } from "~/types";
import { ApolloClient } from "apollo-client";

export interface FormEditorProviderProps {
    id: string;
    defaultLayoutRenderer: string;
    apollo: ApolloClient<any>;
}
export interface FormEditorReducerState extends FormEditorProviderProps {
    data: FbFormModel;
}

const reducerInit = (props: FormEditorReducerState) => {
    return {
        ...props
    };
};

export interface FormEditorReducerAction {
    data: FbFormModel;
    type: string;
}

export interface FormEditorReducer {
    (prev: FormEditorReducerState, action: FormEditorReducerAction): FormEditorReducerState;
}

const formEditorReducer: FormEditorReducer = (state, action) => {
    const next = { ...state };
    switch (action.type) {
        case "data": {
            next.data = action.data;
            break;
        }
    }

    return next;
};

export type FormEditorProviderContextState = FormEditorReducerState;
const FormEditorContext = React.createContext<FormEditorProviderContext>({
    state: {} as FormEditorReducerState,
    dispatch: () => {
        return void 0;
    }
});

export interface FormEditorProviderContext {
    state: FormEditorReducerState;
    dispatch: (action: FormEditorReducerAction) => void;
}

export const FormEditorProvider: React.FC<FormEditorProviderProps> = props => {
    const [state, dispatch] = React.useReducer<FormEditorReducer, any>(
        formEditorReducer,
        {
            ...props,
            data: null
        },
        reducerInit
    );

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    }, [state]);

    return <FormEditorContext.Provider value={value} {...props} />;
};

export const useFormEditor = useFormEditorFactory(FormEditorContext);
