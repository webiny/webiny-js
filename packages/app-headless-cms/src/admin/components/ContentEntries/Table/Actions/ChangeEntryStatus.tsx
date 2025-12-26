import React from "react";
import { ReactComponent as Publish } from "@webiny/icons/visibility.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/visibility_off.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntry, useEntry, usePermission } from "~/admin/hooks/index.js";

export const ChangeEntryStatus = () => {
    const { entry } = useEntry();
    const { canPublish, canUnpublish } = usePermission();
    const { publishEntryRevision, unpublishEntryRevision } = useContentEntry();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

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
