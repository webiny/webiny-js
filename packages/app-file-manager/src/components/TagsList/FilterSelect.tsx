import React from "react";
import { Select, Text } from "@webiny/admin-ui";
import { useFileManagerView } from "~/modules/FileManagerRenderer/FileManagerViewProvider/index.js";

const options = [
    {
        value: "OR",
        label: "match any"
    },
    {
        value: "AND",
        label: "match all"
    }
];

export const FilterSelect = () => {
    const fmView = useFileManagerView();

    return (
        <div className={"flex flex-col gap-sm mb-md"}>
            <Text className={"font-semibold"}>Filter by tag</Text>
            <Select
                disabled={fmView.tags.activeTags.length < 2}
                size={"md"}
                variant={"secondary"}
                value={fmView.tags.filterMode}
                onChange={mode => fmView.tags.setFilterMode(mode)}
                options={options}
                displayResetAction={false}
            />
        </div>
    );
};
