import React from "react";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useConfirmationDialog } from "@webiny/app-admin/hooks/useConfirmationDialog";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as PublishIcon } from "../../../../assets/round-publish-24px.svg";
import { ReactComponent as UnpublishIcon } from "../../../../assets/unpublish.svg";
import { usePublishRevisionHandler } from "../../pageRevisions/usePublishRevisionHandler";
import { PbPageData } from "~/types";
import { makeComposable } from "@webiny/app-admin";
import { usePagesPermissions } from "~/hooks/permissions";
import {useFolders} from "@webiny/app-aco";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/publish");

export interface PublishRevisionProps {
    page: PbPageData;
}

const PublishRevision = (props: PublishRevisionProps) => {
    const { canPublish, canUnpublish, hasPermissions } = usePagesPermissions();
    const { folderLevelPermissions: flp } = useFolders();
    const { page } = props;

    const { publishRevision, unpublishRevision } = usePublishRevisionHandler();

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

    const folderId = page.wbyAco_location?.folderId;
    if (!hasPermissions() || !flp.canManageContent(folderId)) {
        return null;
    }

    if (page.status === "published" && canUnpublish()) {
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

    if (canPublish()) {
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
    }

    return null;
};

export default makeComposable("PublishRevision", PublishRevision);
