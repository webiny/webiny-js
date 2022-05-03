import React from "react";
import { Compose, Plugins } from "@webiny/app-admin";
import { useBind } from "@webiny/form";
import { Select } from "@webiny/ui/Select";
import { ContentEntriesViewRenderer, ContentEntriesViewConfig } from "./ContentEntriesViewConfig";
import { ContentEntriesRenderer } from "./ContentEntriesRenderer";

const { Filter, Sorter } = ContentEntriesViewConfig;

const FilterByStatus = () => {
    const bind = useBind({
        name: "status",
        defaultValue: "all",
        beforeChange(value, cb) {
            cb(value === "all" ? undefined : value);
        }
    });

    return (
        <Select
            {...bind}
            label={"Filter by status"}
            description={"Filter by a specific entry status."}
        >
            <option value={"all"}>All</option>
            <option value={"draft"}>Draft</option>
            <option value={"published"}>Published</option>
            <option value={"unpublished"}>Unpublished</option>
            <option value={"reviewRequested"}>Review requested</option>
            <option value={"changesRequested"}>Changes requested</option>
        </Select>
    );
};

export const ContentEntriesModule = () => {
    return (
        <>
            <Compose component={ContentEntriesViewRenderer} with={ContentEntriesRenderer} />
            <Plugins>
                <ContentEntriesViewConfig>
                    <Filter name={"status"} element={<FilterByStatus />} />
                    <Sorter name={"savedOn_DESC"} label={"Newest to oldest"} />
                    <Sorter name={"savedOn_ASC"} label={"Oldest to newest"} />
                </ContentEntriesViewConfig>
            </Plugins>
        </>
    );
};
