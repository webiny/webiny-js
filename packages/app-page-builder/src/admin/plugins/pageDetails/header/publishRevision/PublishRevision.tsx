import React, { useMemo } from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { useSecurity } from "@webiny/app-security";
import { ReactComponent as PublishIcon } from "@webiny/app-page-builder/admin/assets/round-publish-24px.svg";
import { ReactComponent as UnpublishIcon } from "@webiny/app-page-builder/admin/assets/unpublish.svg";
import { usePublishRevisionHandler } from "../../pageRevisions/usePublishRevisionHandler";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/publish");

const PublishRevision = props => {
    const { identity } = useSecurity();
    const { page } = props;

    const { publishRevision, unpublishRevision } = usePublishRevisionHandler({ page });

    const { showConfirmation: showPublishConfirmation } = useConfirmationDialog({
        title: t`Publish page`,
        message: (
            <p>
                {t`You are about to publish the {title} page. Are you sure you want to continue?`({
                    title: <strong>{page.title}</strong>
                })}
            </p>
        )
    });

    const { showConfirmation: showUnpublishConfirmation } = useConfirmationDialog({
        title: t`Unpublish page`,
        message: (
            <p>
                {t`You are about to unpublish the {title} page. Are you sure you want to continue?`(
                    {
                        title: <strong>{page.title}</strong>
                    }
                )}
            </p>
        )
    });

    const pbPagePermission = useMemo(() => identity.getPermission("pb.page"), []);
    if (!pbPagePermission) {
        return null;
    }

    // If you're only allowed to see your own pages, check that you own the page
    if (pbPagePermission.own && page.ownedBy.id !== identity.login) {
        return null;
    }

    if (page.status === "published") {
        // Check "unpublish" permission
        if (typeof pbPagePermission.pw === "string" && !pbPagePermission.pw.includes("u")) {
            return null;
        }

        return (
            <Tooltip content={t`Unpublish`} placement={"top"}>
                <IconButton
                    icon={<UnpublishIcon />}
                    onClick={() =>
                        showUnpublishConfirmation(async () => {
                            await unpublishRevision(page);
                        })
                    }
                />
            </Tooltip>
        );
    }

    // Check "publish" permission
    if (typeof pbPagePermission.pw === "string" && !pbPagePermission.pw.includes("p")) {
        return null;
    }

    return (
        <Tooltip content={t`Publish`} placement={"top"}>
            <IconButton
                icon={<PublishIcon />}
                onClick={() =>
                    showPublishConfirmation(async () => {
                        await publishRevision(page);
                    })
                }
            />
        </Tooltip>
    );
};

export default PublishRevision;
