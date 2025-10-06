import React, { useCallback, useState } from "react";
import { Button } from "@webiny/admin-ui";
import { useSnackbar } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { useModelEditor } from "~/admin/hooks/index.js";

const t = i18n.namespace("app-headless-cms/admin/editor/top-bar/save-button");

const SaveContentModelButton = () => {
    const { saveContentModel } = useModelEditor();
    const [loading, setLoading] = useState<boolean>(false);
    const { showSnackbar, showErrorSnackbar } = useSnackbar();

    const onClick = useCallback(async () => {
        setLoading(true);
        const response = await saveContentModel();
        setLoading(false);

        if (response.error) {
            showErrorSnackbar(response.error.message);
            return;
        }

        showSnackbar(t`Your content model was saved successfully!`);
    }, [saveContentModel]);

    return (
        <Button
            data-testid="cms.editor.defaultbar.save"
            disabled={loading}
            onClick={() => {
                onClick();
            }}
            text={t`Save`}
        />
    );
};

export default SaveContentModelButton;
