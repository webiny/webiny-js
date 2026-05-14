import React, { useState } from "react";
import { Select, Text } from "@webiny/admin-ui";
import { useFileManagerPresenter } from "~/presentation/FileList/FileManagerPresenterProvider.js";

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
    const { vm, actions } = useFileManagerPresenter();
    const activeTags = (vm.list.filters["tags"] as string[] | undefined) ?? [];
    const [filterMode, setFilterMode] = useState<"AND" | "OR">("OR");

    return (
        <div className={"flex flex-col gap-sm mb-md"}>
            <Text className={"font-semibold"}>Filter by tag</Text>
            <Select
                disabled={activeTags.length < 2}
                size={"md"}
                variant={"secondary"}
                value={filterMode}
                onChange={mode => {
                    const typedMode = mode as "AND" | "OR";
                    setFilterMode(typedMode);
                    if (activeTags.length > 0) {
                        actions.filter.set("tags_rule", typedMode);
                    }
                }}
                options={options}
                displayResetAction={false}
            />
        </div>
    );
};
