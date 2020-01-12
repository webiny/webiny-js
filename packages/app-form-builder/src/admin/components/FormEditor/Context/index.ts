import React from "react";
import useFormEditorFactory from "./useFormEditorFactory";
import { init, formEditorReducer } from "./formEditorReducer";

const FormEditorContext = React.createContext();

export function FormEditorProvider(props) {
    const [state, dispatch] = React.useReducer(formEditorReducer, props, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    }, [state]);

    return <FormEditorContext.Provider value={value} {...props} />;
}

export const useFormEditor = useFormEditorFactory(FormEditorContext);
