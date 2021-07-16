import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useRevision } from "~/admin/views/contentEntries/ContentEntry/useRevision";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import usePermission from "~/admin/hooks/usePermission";
import { CmsEditorContentEntry } from "~/types";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const buttonStyles = css({
    marginLeft: 16
});

const SaveAndPublishButton = () => {
    const { form, loading, entry } = useContentEntry();
    const { publishRevision } = useRevision({ revision: entry });

    const { showConfirmation } = useConfirmationDialog({
        title: t`Publish content`,
        message: (
            <p>{t`You are about to publish a new revision. Are you sure you want to continue?`}</p>
        ),
        dataTestId: "cms-confirm-save-and-publish"
    });

    const { canEdit, canPublish } = usePermission();

    if (!canEdit(entry, "cms.contentEntry") || !canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <ButtonPrimary
            className={buttonStyles}
            onClick={() => {
                showConfirmation(async () => {
                    const entry = (await form.current.submit()) as CmsEditorContentEntry;
                    if (!entry) {
                        return;
                    }
                    await publishRevision(entry.id);
                });
            }}
            disabled={loading}
        >
            {t`Save & Publish`}
        </ButtonPrimary>
    );
};

export default SaveAndPublishButton;
