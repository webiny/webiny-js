import React, { useMemo } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ReactComponent as PublishIcon } from "@webiny/app-page-builder/admin/assets/round-publish-24px.svg";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { usePublishRevisionHandler } from "../../pageRevisions/usePublishRevisionHandler";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/publish");

const PublishRevision = props => {
    const { identity } = useSecurity();
    const { page } = props;

    const { publishRevision } = usePublishRevisionHandler({ page });

    const { showConfirmation } = useConfirmationDialog({
        title: t`Publish page`,
        message: (
            <p>
                {t`You are about to publish {title} page. Are you sure you want to continue?`({
                    title: <strong>{page.title}</strong>
                })}
            </p>
        )
    });

    const pbPagePermission = useMemo(() => identity.getPermission("pb.page"), []);
    if (!pbPagePermission) {
        return null;
    }

    if (pbPagePermission.own && page?.createdBy?.id !== identity.login) {
        return null;
    }

    if (typeof pbPagePermission.pw === "string" && !pbPagePermission.pw.includes("p")) {
        return null;
    }

    const buttonDisabled = page.status === "published";

    return (
        <React.Fragment>
            <Tooltip content={t`Publish`} placement={"top"}>
                <IconButton
                    disabled={buttonDisabled}
                    icon={<PublishIcon />}
                    onClick={() =>
                        showConfirmation(async () => {
                            await publishRevision(page);
                        })
                    }
                />
            </Tooltip>
        </React.Fragment>
    );
};

export default PublishRevision;
