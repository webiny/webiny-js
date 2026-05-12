import React from "react";
import { Icon, Text } from "@webiny/admin-ui";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import type { ComponentGroupItem, ComponentManifest } from "@webiny/website-builder-sdk";
import { InlineSvg } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/InlineSvg.js";
import { Draggable } from "~/BaseEditor/components/Draggable.js";
import { useComponentGroups } from "~/BaseEditor/defaultConfig/Toolbar/InsertElements/useComponentGroups.js";
import { ReactComponent as DashboardIcon } from "@webiny/icons/dashboard_customize.svg";

const useComponent = (name: string) => {
    return useSelectFromEditor<ComponentManifest | undefined>(state => state.components?.[name]);
};

const ListItem = ({ item }: { item: ComponentGroupItem }) => {
    const component = useComponent(item.name);
    if (!component) return <></>;

    return (
        <div className="flex flex-row items-center p-sm bg-neutral-light rounded-lg gap-sm cursor-grab fill-neutral-strong">
            <Icon label="Icon" icon={<InlineSvg src={component.image!} />} size={"md"} />
            <div className="text-sm font-medium text-neutral-primary">
                {component.label ?? component.name}
            </div>
        </div>
    );
};

const GridItem = ({ item }: { item: ComponentGroupItem }) => {
    const component = useComponent(item.name);
    if (!component) return <></>;

    return (
        <div className="flex flex-col items-center justify-center gap-sm px-sm py-md bg-neutral-light rounded-lg cursor-grab fill-neutral-strong w-[80px] min-h-[80px]">
            <Icon
                label="Icon"
                icon={<InlineSvg src={component.image!} />}
                size={"lg"}
                color={"neutral-strong"}
            />
            <div className="text-sm font-medium text-neutral-strong text-center leading-tight">
                {component.label ?? component.name}
            </div>
        </div>
    );
};

interface InsertElementsProps {
    search?: string;
    viewType?: string;
}

export const InsertElements = ({ search = "", viewType = "list" }: InsertElementsProps) => {
    const groups = useComponentGroups();
    const query = search.toLowerCase().trim();
    const isGrid = viewType === "grid";

    return (
        <div className={"p-sm"}>
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
                            <Icon color={"accent"} icon={<DashboardIcon />} label={group.label} />
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
    );
};
