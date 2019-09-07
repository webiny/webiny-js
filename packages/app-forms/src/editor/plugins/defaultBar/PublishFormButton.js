import React from "react";
import { Mutation } from "react-apollo";
import useReactRouter from "use-react-router";
import { ButtonPrimary } from "@webiny/ui/Button";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useFormEditor } from "@webiny/app-forms/admin/components/FormEditor/Context";
import { publishRevision } from "./PublishFormButton/graphql";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormEditor.PublishPageButton");

const PublishFormButton = () => {
    const {
        state: { data }
    } = useFormEditor();

    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();

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

export default PublishFormButton;
