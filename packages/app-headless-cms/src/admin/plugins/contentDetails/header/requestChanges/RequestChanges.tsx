import React, { useMemo } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { useRevision } from "@webiny/app-headless-cms/admin/plugins/contentDetails/contentRevisions/useRevision";
import { ReactComponent as RequestChangesIcon } from "./rule-24px.svg";

const t = i18n.ns("app-headless-cms/admin/content-details/header/request-review");

const RequestChanges = ({ entry, contentModel, setLoading, listQueryVariables }) => {
    const { requestChanges } = useRevision({
        contentModel,
        entry,
        revision: entry,
        setLoading,
        listQueryVariables
    });

    const { identity } = useSecurity();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Changes`,
        message: (
            <p>{t`You are about to request changes on this content entry. Are you sure you want to continue?`}</p>
        )
    });

    const contentEntryPermission = useMemo(() => identity.getPermission("cms.contentEntry"), []);
    if (!contentEntryPermission) {
        return null;
    }

    if (entry.createdBy && entry.createdBy.id === identity.login) {
        return null;
    }

    if (contentEntryPermission.own && entry.createdBy.id !== identity.login) {
        return null;
    }

    if (typeof contentEntryPermission.pw === "string" && !contentEntryPermission.pw.includes("c")) {
        return null;
    }

    const buttonEnabled =
        entry.id && (entry.meta.status === "draft" || entry.meta.status === "reviewRequested");

    return (
        <React.Fragment>
            <Tooltip content={t`Request Changes`} placement={"top"}>
                <IconButton
                    disabled={!buttonEnabled}
                    icon={<RequestChangesIcon />}
                    onClick={() =>
                        showConfirmation(async () => {
                            await requestChanges(entry.id);
                        })
                    }
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default RequestChanges;
