import React, { ReactElement } from "react";
import { ReactComponent as Publish } from "@material-design-icons/svg/outlined/publish.svg";
import { ReactComponent as Restore } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { useConfirmationDialog } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";

import { usePagesPermissions } from "~/hooks/permissions";
import { usePublishRevisionHandler } from "~/admin/plugins/pageDetails/pageRevisions/usePublishRevisionHandler";

import { PbPageTableItem } from "~/types";
import { Icon } from "@webiny/ui/Icon";
import { ListItemGraphic } from "~/admin/components/Table/Table/styled";

const t = i18n.ns("app-headless-cms/app-page-builder/pages-table/actions/page/publish");

interface Props {
    record: PbPageTableItem;
}

export const RecordActionPublish = ({ record }: Props): ReactElement => {
    const { canPublish, canUnpublish } = usePagesPermissions();
    const { publishRevision, unpublishRevision } = usePublishRevisionHandler();

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

    const { hasPermissions } = usePagesPermissions();
    if (!hasPermissions()) {
        return <></>;
    }

    if (record.data.status === "published" && canUnpublish()) {
        return (
            <MenuItem
                onClick={() =>
                    showUnpublishConfirmation(async () => {
                        await unpublishRevision(record.data);
                    })
                }
            >
                <ListItemGraphic>
                    <Icon icon={<Restore />} />
                </ListItemGraphic>
                {t`Unpublish`}
            </MenuItem>
        );
    }

    if (canPublish()) {
        return (
            <MenuItem
                onClick={() =>
                    showPublishConfirmation(async () => {
                        await publishRevision(record.data);
                    })
                }
            >
                <ListItemGraphic>
                    <Icon icon={<Publish />} />
                </ListItemGraphic>
                {t`Publish`}
            </MenuItem>
        );
    }

    return <></>;
};
