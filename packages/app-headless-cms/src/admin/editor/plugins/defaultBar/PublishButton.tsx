import React from "react";
import useReactRouter from "use-react-router";
import { ButtonPrimary } from "@webiny/ui/Button";
import { ConfirmationDialog } from "@webiny/ui/ConfirmationDialog";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { PUBLISH_REVISION } from "./PublishButton/graphql";
import { useMutation } from "@webiny/app-headless-cms/admin/hooks";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("FormEditor.PublishPageButton");

const PublishButton = () => {
    const {
        state: { data }
    } = useContentModelEditor();

    const { showSnackbar } = useSnackbar();
    const { history } = useReactRouter();

    const [update] = useMutation(PUBLISH_REVISION);

    return (
        <ConfirmationDialog
            title={t`Publish form`}
            message={t`You are about to publish this content model, are you sure want to continue?`}
        >
            {({ showConfirmation }) => (
                <ButtonPrimary
                    onClick={async () => {
                        showConfirmation(async () => {
                            const response = await update({
                                variables: {
                                    id: data.id
                                },
                            });

                            const { error } = response.data.publishRevision;
                            if (error) {
                                return showSnackbar(error.message);
                            }

                            history.push(`/cms/content-models`);

                            // Let's wait a bit, because we are also redirecting the user.
                            setTimeout(() => {
                                showSnackbar(t`Your content model was published successfully!`);
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

export default PublishButton;
