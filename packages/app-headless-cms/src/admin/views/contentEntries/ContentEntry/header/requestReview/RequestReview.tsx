import React, { useCallback } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as RequestReviewIcon } from "./emoji_people-24px.svg";
import { useRevision } from "~/admin/views/contentEntries/ContentEntry/useRevision";
import usePermission from "~/admin/hooks/usePermission";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";
import { makeComposable } from "@webiny/react-composition";

const t = i18n.ns("app-headless-cms/admin/content-details/header/request-review");

const RequestReviewComponent: React.FC = () => {
    const { entry } = useContentEntry();
    const { requestReview } = useRevision({ revision: entry });
    const { canRequestReview } = usePermission();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Review`,
        message: (
            <p>{t`You are about to request a review of this content entry. Are you sure you want to continue?`}</p>
        )
    });

    const onClick = useCallback((): void => {
        showConfirmation(async (): Promise<void> => {
            await requestReview(entry.id);
        });
    }, [entry.id]);

    if (!canRequestReview("cms.contentEntry")) {
        return null;
    }

    const buttonEnabled =
        entry.id && (entry.meta.status === "draft" || entry.meta.status === "changesRequested");

    return (
        <React.Fragment>
            <Tooltip content={t`Request Review`} placement={"top"}>
                <IconButton
                    disabled={!buttonEnabled}
                    icon={<RequestReviewIcon />}
                    onClick={onClick}
                />
            </Tooltip>
        </React.Fragment>
    );
};

export const RequestReview = makeComposable("RequestReview", RequestReviewComponent);
