import React, { ReactElement, useMemo } from "react";
import { PbPageData, PbPageDataItem } from "~/types";
import { useSecurity } from "@webiny/app-security";
import usePermission from "~/hooks/usePermission";
import { usePublishRevisionHandler } from "~/admin/plugins/pageDetails/pageRevisions/usePublishRevisionHandler";
import { useConfirmationDialog } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { SecurityPermission } from "@webiny/app-security/types";
import { MenuItem } from "@webiny/ui/Menu";
import { useRecords } from "@webiny/app-aco";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/publish");

interface Props {
    record: PbPageDataItem;
}

export const RecordActionPublish = ({ record }: Props): ReactElement => {
    const { identity, getPermission } = useSecurity();
    const { canPublish, canUnpublish } = usePermission();

    const { publishRevision, unpublishRevision } = usePublishRevisionHandler({ page: record });

    const { showConfirmation: showPublishConfirmation } = useConfirmationDialog({
        title: t`Publish page`,
        message: (
            <p>
                {t`You are about to publish the {title} page. Are you sure you want to continue?`({
                    title: <strong>{record.title}</strong>
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
                        title: <strong>{record.title}</strong>
                    }
                )}
            </p>
        )
    });

    const pbPagePermission = useMemo((): SecurityPermission | null => {
        return getPermission("pb.page");
    }, [identity]);

    if (!pbPagePermission) {
        return <></>;
    }

    if (record.status === "published" && canUnpublish()) {
        return (
            <MenuItem
                onClick={() =>
                    showUnpublishConfirmation(async () => {
                        await unpublishRevision(record);
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
                        await publishRevision(record);
                    })
                }
            >{t`Publish`}</MenuItem>
        );
    }

    return <></>;
};
