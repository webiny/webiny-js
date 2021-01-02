import React from "react";
import { useMutation } from "react-apollo";
import { useRouter } from "@webiny/react-router";
import { ButtonPrimary } from "@webiny/ui/Button";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useFormEditor } from "@webiny/app-form-builder/admin/components/FormEditor/Context";
import { publishRevision } from "./PublishFormButton/graphql";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormEditor.PublishPageButton");

const PublishFormButton = () => {
    const {
        state: { data }
    } = useFormEditor();

    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const [publish] = useMutation(publishRevision);

    return (
        <ConfirmationDialog
            title={t`Publish form`}
            message={t`You are about to publish this form, are you sure want to continue?`}
        >
            {({ showConfirmation }) => (
                <ButtonPrimary
                    onClick={async () => {
                        showConfirmation(async () => {
                            const response = await publish({
                                variables: {
                                    revision: data.id
                                }
                            });

                            const { error } = response.data.formBuilder.publishRevision || {};
                            if (error) {
                                return showSnackbar(error?.message);
                            }

                            history.push(`/forms?id=${encodeURIComponent(data.id)}`);

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
        </ConfirmationDialog>
    );
};

export default PublishFormButton;
