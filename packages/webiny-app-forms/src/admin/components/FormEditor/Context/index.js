import React from "react";
import useFormEditorFactory from "./useFormEditorFactory";
import { init, formEditorReducer } from "./formEditorReducer";

const FormEditorContext = React.createContext();

function FormEditorProvider(props) {
    const [state, dispatch] = React.useReducer(formEditorReducer, props, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    });

    return <FormEditorContext.Provider value={value} {...props} />;
}

const useFormEditor = useFormEditorFactory(FormEditorContext);

export { FormEditorProvider, useFormEditor };
