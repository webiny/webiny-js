import React from "react";
import useFormEditorFactory from "./useFormEditorFactory";
import { init, formEditorReducer } from "./formEditorReducer";
import { ApolloClient } from "apollo-client";

const FormEditorContext = React.createContext({});

interface FormEditorProviderProps {
    apollo: ApolloClient<any>;
    id: string;
    defaultLayoutRenderer: string;
}
export const FormEditorProvider: React.FC<FormEditorProviderProps> = props => {
    const [state, dispatch] = React.useReducer(formEditorReducer, props, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    }, [state]);

    return <FormEditorContext.Provider value={value} {...props} />;
};

export const useFormEditor = useFormEditorFactory(FormEditorContext);
