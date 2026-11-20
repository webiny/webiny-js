import React, { useLayoutEffect } from "react";
import {
    Icon,
    Text,
    ScrollArea,
    InputPrimitive,
    ToggleGroupPrimitive,
    FillViewportHeight
} from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ListIcon } from "@webiny/icons/format_list_bulleted.svg";
import { ReactComponent as GridIcon } from "@webiny/icons/grid_view.svg";
import { ReactComponent as DashboardIcon } from "@webiny/icons/dashboard_customize.svg";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import type { InsertElementsPresenter } from "./abstractions.js";
import { InsertElementsFeature } from "./feature.js";
import { InlineSvg } from "./InlineSvg.js";
import { GroupItemsList } from "./GroupItemsList.js";
import { GroupItemsGrid } from "./GroupItemsGrid.js";

const VIEW_ITEMS = [
    { value: "list", icon: <Icon icon={<ListIcon />} label={"List view"} /> },
    { value: "grid", icon: <Icon icon={<GridIcon />} label={"Grid view"} /> }
];

export const InsertElements = createReactiveComponent(() => {
    const editor = useDocumentEditor();
    const { presenter } = useFeature(InsertElementsFeature);

    // Before the first paint, so the panel doesn't show up empty first.
    useLayoutEffect(() => presenter.init(editor), [presenter, editor]);

    const { search, view, groups } = presenter.vm;
    const isGrid = view === "grid";

    return (
        <div className={"mb-sm pt-sm"}>
            <div className={"flex items-center gap-xs mb-md"}>
                <InputPrimitive
                    value={search}
                    onChange={value => presenter.setSearch(value ?? "")}
                    onEscape={() => presenter.setSearch("")}
                    placeholder={"Search..."}
                    startIcon={<Icon icon={<SearchIcon />} label={"Search"} />}
                    variant={"secondary"}
                    size={"md"}
                />
                <ToggleGroupPrimitive
                    items={VIEW_ITEMS}
                    value={view}
                    onChange={v => v && presenter.setView(v as InsertElementsPresenter.View)}
                    variant={"ghost"}
                    size={"md"}
                />
            </div>
            <FillViewportHeight>
                <ScrollArea className={"h-full"}>
                    <div>
                        {groups.map(group => {
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
                                        <GroupItemsGrid items={group.items} />
                                    ) : (
                                        <GroupItemsList items={group.items} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </FillViewportHeight>
        </div>
    );
});
