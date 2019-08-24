import React from "react";
import { ConfirmationDialog } from "webiny-ui/ConfirmationDialog";
import { ButtonPrimary } from "webiny-ui/Button";
import { compose } from "recompose";
import { Mutation } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import { withRouter } from "react-router-dom";
import { publishRevision } from "./PublishFormButton/graphql";
import { useFormEditor } from "webiny-app-forms/admin/components/FormEditor/Context";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormEditor.PublishPageButton");

const PublishFormButton = ({ showSnackbar, history }) => {
    const {
        state: { data }
    } = useFormEditor();

    return (
        <ConfirmationDialog
            title={t`Publish form`}
            message={t`You are about to publish this form, are you sure want to continue?`}
        >
            {({ showConfirmation }) => (
                <Mutation mutation={publishRevision} refetchQueries={["FormsListForms"]}>
                    {update => (
                        <ButtonPrimary
                            onClick={async () => {
                                showConfirmation(async () => {
                                    const response = await update({
                                        variables: {
                                            id: data.id
                                        }
                                    });

                                    const { error } = response.data.forms.publishRevision;
                                    if (error) {
                                        return showSnackbar(error.message);
                                    }

                                    history.push(`/forms?id=${data.id}`);

                                    // Let's wait a bit, because we are also redirecting the user.
                                    setTimeout(() => {
                                        showSnackbar(t`Your form was published successfully!`);
                                    }, 500);
                                });
                            }}
                        >
                            {data.version > 1 ? t`Publish changes` : t`Publish`}
                        </ButtonPrimary>
                    )}
                </Mutation>
            )}
        </ConfirmationDialog>
    );
};

export default compose(
    withSnackbar(),
    withRouter
)(PublishFormButton);
