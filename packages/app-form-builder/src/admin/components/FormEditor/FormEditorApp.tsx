import React from "react";
import { useApolloClient } from "react-apollo";
import { useRouter } from "@webiny/react-router";
import { FormEditorProvider } from "./Context";
import FormEditor from "./FormEditor";
import { match } from "react-router";

const FormEditorApp = () => {
    const router = useRouter();
    const client = useApolloClient();

    const matched: match<{
        id?: string;
    }> = router.match;
    const { id } = matched.params;
    const { hash } = router.location;
    const formIdWithRevision = `${id}${hash}`;

    return (
        <FormEditorProvider
            key={formIdWithRevision}
            apollo={client}
            id={formIdWithRevision}
            defaultLayoutRenderer={"forms-form-layout-default"}
        >
            <FormEditor />
        </FormEditorProvider>
    );
};

export default FormEditorApp;
