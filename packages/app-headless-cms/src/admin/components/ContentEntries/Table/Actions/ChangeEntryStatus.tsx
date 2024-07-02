import React from "react";
import { ReactComponent as Publish } from "@material-design-icons/svg/outlined/publish.svg";
import { ReactComponent as Unpublish } from "@material-design-icons/svg/outlined/settings_backup_restore.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useContentEntry, useEntry, usePermission } from "~/admin/hooks";

export const ChangeEntryStatus = () => {
    const { entry } = useEntry();
    const { canPublish, canUnpublish } = usePermission();
    const { publishEntryRevision, unpublishEntryRevision } = useContentEntry();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.EntryAction;

    if (entry.meta.status === "published" && canUnpublish("cms.contentEntry")) {
        return (
            <OptionsMenuItem
                icon={<Unpublish />}
                label={"Unpublish"}
                onAction={() => unpublishEntryRevision({ id: entry.id })}
                data-testid={"aco.actions.entry.unpublish"}
            />
        );
    }

    if (!canPublish("cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<Publish />}
            label={"Publish"}
            onAction={() => publishEntryRevision({ id: entry.id })}
            data-testid={"aco.actions.entry.publish"}
        />
    );
};
