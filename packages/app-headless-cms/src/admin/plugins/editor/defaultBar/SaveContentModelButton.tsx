import React, { useCallback, useState } from "react";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { i18n } from "@webiny/app/i18n";
import { useContentModelEditor } from "~/admin/components/ContentModelEditor/useContentModelEditor";

const t = i18n.namespace("app-headless-cms/admin/editor/top-bar/save-button");

const SaveContentModelButton: React.FC = () => {
    const { saveContentModel } = useContentModelEditor();
    const [loading, setLoading] = useState<boolean>(false);
    const { showSnackbar } = useSnackbar();

    const onClick = useCallback(async () => {
        setLoading(true);
        const response = await saveContentModel();
        setLoading(false);

        if (response.error) {
            showSnackbar(response.error.message);
            return;
        }

        showSnackbar(t`Your content model was saved successfully!`);
    }, [saveContentModel]);

    return (
        <ButtonPrimary
            data-testid="cms.editor.defaultbar.save"
            disabled={loading}
            onClick={() => {
                onClick();
            }}
        >
            {t`Save`}
        </ButtonPrimary>
    );
};

export default SaveContentModelButton;
