import React from "react";
import useFormEditorFactory from "./useFormEditorFactory";

const defaultData = () => ({
    name: "Unnamed",
    version: 1,
    locked: false,
    fields: [],
    triggers: {
        redirect: "",
        message: null,
        webhook: ""
    }
});

function init(props) {
    return {
        apollo: null,
        loaded: false,
        fields: [],
        data: defaultData(),
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
            next.fields = action.data;
            break;
        }
        case "loaded": {
            next.loaded = action.state;
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
