import React from "react";
import useFormEditorFactory from "./useFormEditorFactory";

function init(props) {
    return {
        apollo: null,
        data: null,
        ...props
    };
}

function formEditorReducer(state, action) {
    const next = { ...state };
    switch (action.type) {
        case "name": {
            next.data.name = action.value;
            break;
        }
        case "fields": {
            next.data.fields = action.data;
            break;
        }
        case "data": {
            next.data = action.data;
            break;
        }
    }

    return next;
}

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
