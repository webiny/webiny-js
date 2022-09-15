import React, { useCallback, useState } from "react";
import { useSnackbar, createComponentPlugin } from "@webiny/app-admin";
import { ButtonPrimary } from "@webiny/ui/Button";
import { i18n } from "@webiny/app/i18n";
import { Editor, useContentModelEditor } from "~/modelEditor";

const t = i18n.namespace("app-headless-cms/admin/editor/top-bar/save-button");

export const SaveContentModelButton = createComponentPlugin(
    Editor.Header.RightSection,
    Original => {
        return function RightSection() {
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
                <>
                    <Original />
                    <ButtonPrimary
                        data-testid="cms.editor.defaultbar.save"
                        disabled={loading}
                        onClick={() => {
                            onClick();
                        }}
                    >
                        {t`Save`}
                    </ButtonPrimary>
                </>
            );
        };
    }
);
