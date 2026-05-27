import React, { useState } from "react";
import { Icon, Text, ScrollArea, InputPrimitive, ToggleGroupPrimitive } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/format_list_bulleted.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as DashboardIcon } from "@webiny/icons/dashboard_customize.svg";
import { useComponentGroups } from "./useComponentGroups.js";
import { InlineSvg } from "./InlineSvg.js";
import { GroupItemsList } from "./GroupItemsList.js";
import { GroupItemsGrid } from "./GroupItemsGrid.js";

const VIEW_ITEMS = [
    { value: "list", icon: <Icon icon={<ListIcon />} label={"List view"} /> },
    { value: "grid", icon: <Icon icon={<GridIcon />} label={"Grid view"} /> }
];

export const InsertElements = () => {
    const [search, setSearch] = useState("");
    const [viewType, setViewType] = useState("list");
    const groups = useComponentGroups();
    const query = search.toLowerCase().trim();
    const isGrid = viewType === "grid";

    return (
        <div className={"mb-sm pt-sm"}>
            <div className={"flex-shrink-0 flex items-center gap-xs mb-md"}>
                <InputPrimitive
                    value={search}
                    onChange={value => setSearch(value ?? "")}
                    onEscape={() => setSearch("")}
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
            <ScrollArea className={"flex-1 min-h-0"}>
                <div>
                    {groups.map(group => {
                        const items = query
                            ? group.items.filter(item =>
                                  (item.label ?? item.name).toLowerCase().includes(query)
                              )
                            : group.items;

                        if (!items.length) {
                            return null;
                        }

                        return (
                            <div key={group.name} className={"p-sm flex flex-col gap-y-sm"}>
                                <div className={"flex gap-x-sm"}>
                                    <Icon
                                        color={"accent"}
                                        icon={
                                            group.icon ? (
                                                <InlineSvg src={group.icon} />
                                            ) : (
                                                <DashboardIcon />
                                            )
                                        }
                                        label={group.label}
                                    />
                                    <Text size={"md"} className={"font-semibold"}>
                                        {group.label}
                                    </Text>
                                </div>
                                {isGrid ? (
                                    <GroupItemsGrid items={items} />
                                ) : (
                                    <GroupItemsList items={items} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};
