import React, { useState } from "react";
import {
    SegmentedControl,
    ScrollArea,
    InputPrimitive,
    Icon,
    ToggleGroupPrimitive
} from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/format_list_bulleted.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as InsertIcon } from "@webiny/icons/add_circle_outline.svg";
import { InsertElements } from "./InsertElements.js";

const VIEW_ITEMS = [
    { value: "list", icon: <Icon icon={<ListIcon />} label={"List view"} /> },
    { value: "grid", icon: <Icon icon={<GridIcon />} label={"Grid view"} /> }
];

const InsertElementsContent = () => {
    const [search, setSearch] = useState("");
    const [viewType, setViewType] = useState("list");

    return (
        <div className={"h-full flex flex-col"}>
            <div
                className={
                    "flex-shrink-0 flex items-center gap-xs px-sm py-xs border-b-sm border-b-neutral-dimmed"
                }
            >
                <InputPrimitive
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={"Search..."}
                    startIcon={<Icon icon={<SearchIcon />} label={"Search"} />}
                    variant={"secondary"}
                    size={"md"}
                />
                <ToggleGroupPrimitive
                    items={VIEW_ITEMS}
                    value={viewType}
                    onChange={v => v && setViewType(v)}
                    variant={"ghost"}
                    size={"md"}
                />
            </div>
            <ScrollArea className={"flex-1"}>
                <InsertElements search={search} viewType={viewType} />
            </ScrollArea>
        </div>
    );
};

export const InsertElementsTab = () => (
    <SegmentedControl.Tab
        value={"insert"}
        trigger={"Insert"}
        icon={<Icon icon={<InsertIcon />} label={"Insert Element"} />}
        content={<InsertElementsContent />}
    />
);
