import React from "react";
import { useApolloClient } from "react-apollo";
import useReactRouter from "use-react-router";
import { FormEditorProvider } from "./Context";
import FormEditor from "./FormEditor";
import { match } from "react-router";

const FormEditorApp = () => {
    const router = useReactRouter();
    const client = useApolloClient();

    const matched: match<{
        id?: string;
    }> = router.match;
    const { id } = matched.params;

    return (
        <FormEditorProvider
            key={id}
            apollo={client}
            id={id}
            defaultLayoutRenderer={"forms-form-layout-default"}
        >
            <FormEditor />
        </FormEditorProvider>
    );
};

export default FormEditorApp;
