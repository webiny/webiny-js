import React from "react";
import { ReactComponent as Publish } from "@webiny/icons/visibility.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/visibility_off.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useEntry, usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";

export const ChangeEntryStatus = () => {
    const { entry } = useEntry();
    const { canPublish, canUnpublish } = usePermission();
    const presenter = useContentEntriesPresenter();
    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    if (entry.meta.status === "published" && canUnpublish("cms.contentEntry")) {
        return (
            <OptionsMenuItem
                icon={<Unpublish />}
                label={"Unpublish"}
                onAction={async () => {
                    await presenter.unpublishEntry(entry.id);
                }}
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
            onAction={async () => {
                await presenter.publishEntry(entry.id);
            }}
            data-testid={"aco.actions.entry.publish"}
        />
    );
};
