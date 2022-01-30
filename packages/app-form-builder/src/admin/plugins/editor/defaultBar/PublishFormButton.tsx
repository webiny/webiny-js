import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import { ButtonPrimary } from "@webiny/ui/Button";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { useFormEditor } from "~/admin/components/FormEditor";
import { PUBLISH_REVISION } from "~/admin/graphql";
import { usePermission } from "~/hooks/usePermission";

const t = i18n.namespace("FormEditor.PublishPageButton");

const PublishFormButton: React.FC = () => {
    const {
        state: { data }
    } = useFormEditor();

    const { showSnackbar } = useSnackbar();
    const { history } = useRouter();

    const [publish] = useMutation(PUBLISH_REVISION);
    const { canPublish } = usePermission();

    // Render nothing if required permission is missing.
    if (!canPublish()) {
        return null;
    }

    return (
        <ConfirmationDialog
            title={t`Publish form`}
            message={t`You are about to publish this form, are you sure want to continue?`}
            data-testid={"fb.editor.default-bar.publish-dialog"}
        >
            {({ showConfirmation }) => (
                <ButtonPrimary
                    data-testid={"fb.editor.default-bar.publish"}
                    onClick={async () => {
                        showConfirmation(async () => {
                            await publish({
                                variables: {
                                    revision: data.id
                                },
                                update(_, { data }) {
                                    const { data: revision, error } =
                                        data.formBuilder.publishRevision || {};

                                    if (error) {
                                        return showSnackbar(error.message);
                                    }

                                    history.push(
                                        `/form-builder/forms?id=${encodeURIComponent(revision.id)}`
                                    );

                                    // Let's wait a bit, because we are also redirecting the user.
                                    setTimeout(() => {
                                        showSnackbar(t`Your form was published successfully!`);
                                    }, 500);
                                }
                            });
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
