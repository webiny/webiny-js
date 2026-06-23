import React, { useMemo } from "react";
import { Text, IconButton, Button } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons, useListView } from "@webiny/app-admin";

import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";

import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-headless-cms/admin/content-entries/bulk-actions");

export const SelectAll = () => {
    const { list, actions } = useListView();

    if (list.selection.selectedCount === 0) {
        return null;
    }

    return (
        <div data-testid={"select-all-container"}>
            {list.selection.allSelected ? (
                <Button
                    text={"Clear selection"}
                    onClick={() => actions.selection.deselectAll()}
                    size={"sm"}
                    variant={"ghost"}
                />
            ) : (
                <Button
                    text={"Select all remaining entries"}
                    onClick={() => actions.selection.selectAll()}
                    size={"sm"}
                    variant={"secondary"}
                />
            )}
        </div>
    );
};

export const BulkActions = () => {
    const { browser } = useContentEntryListConfig();
    const { list, actions } = useListView();

    const count = list.selection.selectedCount;
    const isAll = list.selection.allSelected;

    const headline = useMemo((): string => {
        if (isAll) {
            return t("All entries selected");
        }

        return t`{count|count:1:entry:default:entries} selected`({
            count
        });
    }, [count, isAll]);

    if (count === 0) {
        return null;
    }

    return (
        <div className={"w-full bg-neutral-disabled px-md py-sm"}>
            <div className={"flex items-center justify-between gap-sm"}>
                <div className={"flex items-center gap-sm"}>
                    <Text size={"sm"} className={"text-neutral-strong"}>
                        {headline}
                    </Text>
                    <SelectAll />
                </div>

                <div className={"flex items-center gap-sm"}>
                    <Buttons actions={browser.bulkActions} />
                    <IconButton
                        variant={"ghost"}
                        size={"sm"}
                        icon={<Close />}
                        onClick={() => actions.selection.deselectAll()}
                    />
                </div>
            </div>
        </div>
    );
};
