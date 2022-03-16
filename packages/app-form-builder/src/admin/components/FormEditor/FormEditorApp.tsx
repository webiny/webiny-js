import React from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { FormEditorProvider } from "./Context";
import FormEditor from "./FormEditor";

const FormEditorApp: React.FC = () => {
    const router = useRouter();
    const client = useApolloClient();

    const matched = router.match;
    const { id = undefined } = matched ? matched.params : {};

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
