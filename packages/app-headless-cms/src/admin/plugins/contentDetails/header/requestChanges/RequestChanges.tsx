import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useRevision } from "../../contentRevisions/useRevision";
import { ReactComponent as RequestChangesIcon } from "./rule-24px.svg";
import usePermission from "../../../../hooks/usePermission";

const t = i18n.ns("app-headless-cms/admin/content-details/header/request-review");

const RequestChanges = ({ entry, contentModel, setLoading, listQueryVariables }) => {
    const { requestChanges } = useRevision({
        contentModel,
        entry,
        revision: entry,
        setLoading,
        listQueryVariables
    });

    const { canRequestChange } = usePermission();

    const { showConfirmation } = useConfirmationDialog({
        title: t`Request Changes`,
        message: (
            <p>{t`You are about to request changes on this content entry. Are you sure you want to continue?`}</p>
        )
    });

    if (!canRequestChange("cms.contentEntry")) {
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
