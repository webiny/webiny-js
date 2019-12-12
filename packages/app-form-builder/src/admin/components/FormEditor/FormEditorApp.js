import React from "react";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import { FormEditorProvider } from "./Context";
import FormEditor from "./FormEditor";

const FormEditorApp = () => {
    const { match } = useReactRouter();
    const client = useApolloClient();
    const formId = match.params.id;

    return (
        <FormEditorProvider
            key={formId}
            apollo={client}
            id={formId}
            defaultLayoutRenderer={"forms-form-layout-default"}
        >
            <FormEditor />
        </FormEditorProvider>
    );
};

export default FormEditorApp;
