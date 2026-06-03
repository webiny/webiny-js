import React from "react";
import { ReactComponent as Publish } from "@webiny/icons/visibility.svg";
import { ReactComponent as Unpublish } from "@webiny/icons/visibility_off.svg";
import { ContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useEntry, usePermission } from "~/admin/hooks/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/views/ContentEntriesPresenterProvider.js";
import { useToast } from "@webiny/admin-ui";

export const ChangeEntryStatus = () => {
    const { entry } = useEntry();
    const toast = useToast();
    const { canPublish, canUnpublish } = usePermission();
    const presenter = useContentEntriesPresenter();

    const { OptionsMenuItem } = ContentEntryListConfig.Browser.Entry.Action;

    if (entry.meta.status === "published" && canUnpublish("cms.contentEntry")) {
        return (
            <OptionsMenuItem
                icon={<Unpublish />}
                label={"Unpublish"}
                onAction={async () => {
                    const success = await presenter.unpublishEntry(entry.id);
                    if (success) {
                        toast.showSuccessToast({
                            title: `${entry.meta.title} was unpublished successfully!`
                        });
                    }
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
                const success = await presenter.publishEntry(entry.id);
                if (success) {
                    toast.showSuccessToast({
                        title: `${entry.meta.title} was published successfully!`
                    });
                }
            }}
            data-testid={"aco.actions.entry.publish"}
        />
    );
};
