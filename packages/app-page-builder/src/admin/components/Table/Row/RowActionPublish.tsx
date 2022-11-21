import React, { useMemo } from "react";
import { PbPageData } from "~/types";
import { useSecurity } from "@webiny/app-security";
import usePermission from "~/hooks/usePermission";
import { usePublishRevisionHandler } from "~/admin/plugins/pageDetails/pageRevisions/usePublishRevisionHandler";
import { useConfirmationDialog } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { SecurityPermission } from "@webiny/app-security/types";
import { MenuItem } from "@webiny/ui/Menu";

const t = i18n.ns("app-headless-cms/app-page-builder/page-details/header/publish");

interface RowActionPublishPageProps {
    page: PbPageData;
}

const RowActionPublishPage: React.FC<RowActionPublishPageProps> = props => {
    const { page } = props;
    const { identity, getPermission } = useSecurity();
    const { canPublish, canUnpublish } = usePermission();

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

    const pbPagePermission = useMemo((): SecurityPermission | null => {
        return getPermission("pb.page");
    }, [identity]);
    if (!pbPagePermission) {
        return null;
    }

    if (page.status === "published" && canUnpublish()) {
        return (
            <MenuItem
                onClick={() =>
                    showUnpublishConfirmation(async () => {
                        await unpublishRevision(page);
                    })
                }
            >{t`Unpublish`}</MenuItem>
        );
    }

    if (canPublish()) {
        return (
            <MenuItem
                onClick={() =>
                    showPublishConfirmation(async () => {
                        await publishRevision(page);
                    })
                }
            >{t`Publish`}</MenuItem>
        );
    }

    return null;
};

export default RowActionPublishPage;
