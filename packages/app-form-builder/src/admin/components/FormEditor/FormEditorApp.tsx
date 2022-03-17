import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { FormEditorProvider } from "./Context";
import FormEditor from "./FormEditor";

const FormEditorApp: React.FC = () => {
    const { params } = useRouter();
    const client = useApolloClient();

    const id = params ? params["id"] : undefined;

    return (
        <FormEditorProvider
            key={id}
            apollo={client}
            // TODO @ts-refactor can id be undefined?
            // @ts-ignore
            id={id}
            defaultLayoutRenderer={"forms-form-layout-default"}
        >
            <FormEditor />
        </FormEditorProvider>
    );
};

export default FormEditorApp;
