import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { useRevision } from "../../contentRevisions/useRevision";
import usePermission from "../../../../hooks/usePermission";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/header/publish-revision");

const buttonStyles = css({
    marginLeft: 16
});

const SaveAndPublishButton = ({
    entry,
    contentModel,
    getLoading,
    setLoading,
    state,
    listQueryVariables
}) => {
    const { publishRevision } = useRevision({
        contentModel,
        entry,
        revision: entry,
        setLoading,
        listQueryVariables
    });

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
                    const entry = await state.contentForm.submit();
                    if (!entry) {
                        return;
                    }
                    await publishRevision(entry.id);
                });
            }}
            disabled={getLoading()}
        >
            {t`Save & Publish`}
        </ButtonPrimary>
    );
};

export default SaveAndPublishButton;
