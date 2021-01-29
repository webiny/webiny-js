import React, { useMemo } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { useRevision } from "@webiny/app-headless-cms/admin/plugins/contentDetails/contentRevisions/useRevision";
import { ReactComponent as RequestReviewIcon } from "./emoji_people-24px.svg";

const t = i18n.ns("app-headless-cms/admin/content-details/header/request-review");

const RequestReview = ({ entry, contentModel, setLoading, listQueryVariables }) => {
    const { requestReview } = useRevision({
        contentModel,
        entry,
        revision: entry,
        setLoading,
        listQueryVariables
    });

    const { identity } = useSecurity();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Review`,
        message: (
            <p>{t`You are about to request a review of this content entry. Are you sure you want to continue?`}</p>
        )
    });

    const contentEntryPermission = useMemo(() => identity.getPermission("cms.contentEntry"), []);
    if (!contentEntryPermission) {
        return null;
    }

    if (contentEntryPermission.own && entry.createdBy.id !== identity.login) {
        return null;
    }

    if (typeof contentEntryPermission.pw === "string" && !contentEntryPermission.pw.includes("r")) {
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
