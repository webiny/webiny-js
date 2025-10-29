import React, { useMemo } from "react";
import { Text, IconButton, Button } from "@webiny/admin-ui";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { Buttons } from "@webiny/app-admin";

import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntriesList } from "~/admin/views/contentEntries/hooks/index.js";

import { i18n } from "@webiny/app/i18n/index.js";

const t = i18n.ns("app-headless-cms/admin/content-entries/bulk-actions");

export const getEntriesLabel = (): string => {
    const { selected, isSelectedAll } = useContentEntriesList();

    if (isSelectedAll) {
        return "all entries";
    }

    return `${selected.length} ${selected.length === 1 ? "entry" : "entries"}`;
};

export const SelectAll = () => {
    const list = useContentEntriesList();

    if (!list.showingSelectAll) {
        return null;
    }

    return (
        <div data-testid={"select-all-container"}>
            {list.isSelectedAll ? (
                <Button
                    text={"Clear selection"}
                    onClick={list.unselectAll}
                    size={"sm"}
                    variant={"ghost"}
                />
            ) : (
                <Button
                    text={"Select all remaining entries"}
                    onClick={list.selectAll}
                    size={"sm"}
                    variant={"secondary"}
                />
            )}
        </div>
    );
};

export const BulkActions = () => {
    const { browser } = useContentEntryListConfig();
    const { selected, setSelected, isSelectedAll } = useContentEntriesList();

    const headline = useMemo((): string => {
        if (isSelectedAll) {
            return t("All entries selected");
        }

        return t`{count|count:1:entry:default:entries} selected`({
            count: selected.length
        });
    }, [selected.length, isSelectedAll]);

    if (!selected.length) {
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
                        onClick={() => setSelected([])}
                    />
                </div>
            </div>
        </div>
    );
};
