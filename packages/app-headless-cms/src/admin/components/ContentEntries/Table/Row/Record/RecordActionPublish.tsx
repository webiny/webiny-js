import React from "react";
import { ReactComponent as Publish } from "@material-design-icons/svg/outlined/publish.svg";
import { ReactComponent as Restore } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { useConfirmationDialog } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n";
import { MenuItem } from "@webiny/ui/Menu";
import { Icon } from "@webiny/ui/Icon";
import { ListItemGraphic } from "@webiny/ui/List";
import { usePermission } from "~/admin/hooks";
import { useRevision } from "~/admin/views/contentEntries/ContentEntry/useRevision";
import { CmsContentEntryStatusType } from "@webiny/app-headless-cms-common/types";

const t = i18n.ns("app-headless-cms/pages-table/actions/page/publish");

interface Props {
    record: {
        id: string;
        title: string;
        status: CmsContentEntryStatusType;
        original: {
            id: string;
            meta: {
                version: number;
            };
        };
    };
}

export const RecordActionPublish: React.VFC<Props> = ({ record }) => {
    const { canPublish, canUnpublish } = usePermission();

    const { unpublishRevision, publishRevision } = useRevision({
        revision: {
            id: record.original.id,
            meta: {
                version: record.original.meta.version
            }
        }
    });

    const { showConfirmation: showPublishConfirmation } = useConfirmationDialog({
        title: t`Publish CMS Entry`,
        message: (
            <p>
                {t`You are about to publish the {title} CMS entry. Are you sure you want to continue?`(
                    {
                        title: <strong>{record.title}</strong>
                    }
                )}
            </p>
        )
    });

    const { showConfirmation: showUnpublishConfirmation } = useConfirmationDialog({
        title: t`Unpublish CMS Entry`,
        message: (
            <p>
                {t`You are about to unpublish the {title} CMS entry. Are you sure you want to continue?`(
                    {
                        title: <strong>{record.title}</strong>
                    }
                )}
            </p>
        )
    });

    if (record.status === "published" && canUnpublish("cms.contentEntry")) {
        return (
            <MenuItem
                onClick={() =>
                    showUnpublishConfirmation(async () => {
                        await unpublishRevision(record.original.id);
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

    if (!canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <MenuItem
            onClick={() =>
                showPublishConfirmation(async () => {
                    await publishRevision(record.original.id);
                })
            }
        >
            <ListItemGraphic>
                <Icon icon={<Publish />} />
            </ListItemGraphic>
            {t`Publish`}
        </MenuItem>
    );
};
