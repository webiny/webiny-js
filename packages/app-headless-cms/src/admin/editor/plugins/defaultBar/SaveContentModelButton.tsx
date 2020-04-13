import React from "react";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";

import { i18n } from "@webiny/app/i18n";
const t = i18n.namespace("ContentModelEditor.PublishPageButton");

const SaveContentModelButton = () => {
    const { saveContentModel } = useContentModelEditor();

    const { showSnackbar } = useSnackbar();

    return (
        <ButtonPrimary
            onClick={async () => {
                await saveContentModel();
                // Let's wait a bit, because we are also redirecting the user.
                setTimeout(() => {
                    showSnackbar(t`Your content model was saved successfully!`);
                }, 500);
            }}
        >
            {t`Save`}
        </ButtonPrimary>
    );
};

export default SaveContentModelButton;
