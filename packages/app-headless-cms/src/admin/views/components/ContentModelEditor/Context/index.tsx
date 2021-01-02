import React from "react";
import useContentModelEditorFactory from "./useContentModelEditorFactory";
import { init, contentModelEditorReducer } from "./contentModelEditorReducer";

const ContentModelEditorContext = React.createContext({});

export function ContentModelEditorProvider(props) {
    const [state, dispatch] = React.useReducer(contentModelEditorReducer, props, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    }, [state]);

    return <ContentModelEditorContext.Provider value={value} {...props} />;
}

export const useContentModelEditor = useContentModelEditorFactory(ContentModelEditorContext);
