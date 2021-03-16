import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useRevision } from "../../contentRevisions/useRevision";
import { ReactComponent as RequestReviewIcon } from "./emoji_people-24px.svg";
import usePermission from "../../../../hooks/usePermission";

const t = i18n.ns("app-headless-cms/admin/content-details/header/request-review");

const RequestReview = ({ entry, contentModel, setLoading, listQueryVariables }) => {
    const { requestReview } = useRevision({
        contentModel,
        entry,
        revision: entry,
        setLoading,
        listQueryVariables
    });

    const { canRequestReview } = usePermission();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Review`,
        message: (
            <p>{t`You are about to request a review of this content entry. Are you sure you want to continue?`}</p>
        )
    });

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
                    onClick={() =>
                        showConfirmation(async () => {
                            await requestReview(entry.id);
                        })
                    }
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default RequestReview;
