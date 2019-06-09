import React from "react";
import { FormEditorProvider } from "./Context";
import { withApollo } from "react-apollo";
import FormEditor from "./FormEditor";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";

const FormEditorApp = ({ client, match }) => {
    return (
        <FormEditorProvider
            apollo={client}
            id={match.params.id}
            defaultLayoutRenderer={"forms-form-layout-default"}
        >
            <FormEditor />
        </FormEditorProvider>
    );
};

export default compose(
    withRouter,
    withApollo
)(FormEditorApp);
