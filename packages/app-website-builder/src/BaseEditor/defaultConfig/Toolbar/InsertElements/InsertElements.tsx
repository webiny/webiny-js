import React, { useState } from "react";
import { Icon, Text, ScrollArea, InputPrimitive, ToggleGroupPrimitive } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/format_list_bulleted.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as DashboardIcon } from "@webiny/icons/dashboard_customize.svg";
import { Draggable } from "~/BaseEditor/components/Draggable.js";
import { useComponentGroups } from "./useComponentGroups.js";
import { ListItem } from "./ListItem.js";
import { GridItem } from "./GridItem.js";

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
                <div className={"p-sm"}>
                    {groups.map(group => {
                        const items = query
                            ? group.items.filter(item =>
                                  (item.label ?? item.name).toLowerCase().includes(query)
                              )
                            : group.items;

                        if (!items.length) return null;

                        return (
                            <div key={group.name} className={"p-sm flex flex-col gap-y-sm"}>
                                <div className={"flex gap-x-sm"}>
                                    <Icon
                                        color={"accent"}
                                        icon={<DashboardIcon />}
                                        label={group.label}
                                    />
                                    <Text size={"md"} className={"font-semibold"}>
                                        {group.label}
                                    </Text>
                                </div>
                                <div
                                    className={
                                        isGrid
                                            ? "grid grid-cols-3 gap-sm px-lg py-sm"
                                            : "py-sm px-xl flex flex-col gap-y-xs"
                                    }
                                    data-role={"group-items"}
                                >
                                    {items.map(item => (
                                        <Draggable
                                            key={item.name}
                                            type="ELEMENT"
                                            item={{ componentName: item.name }}
                                        >
                                            {({ dragRef }) =>
                                                dragRef(
                                                    <div>
                                                        {isGrid ? (
                                                            <GridItem item={item} />
                                                        ) : (
                                                            <ListItem item={item} />
                                                        )}
                                                    </div>
                                                )
                                            }
                                        </Draggable>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};
