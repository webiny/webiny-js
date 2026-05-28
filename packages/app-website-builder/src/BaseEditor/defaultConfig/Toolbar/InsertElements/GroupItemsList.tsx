import React from "react";
import type { ComponentGroupItem } from "@webiny/website-builder-sdk";
import { Draggable } from "~/BaseEditor/components/Draggable.js";
import { ListItem } from "./ListItem.js";

interface GroupItemsListProps {
    items: ComponentGroupItem[];
}

export const GroupItemsList = ({ items }: GroupItemsListProps) => (
    <div className={"py-sm px-xl flex flex-col gap-y-xs"} data-role={"group-items"}>
        {items.map(item => (
            <Draggable key={item.name} type="ELEMENT" item={{ componentName: item.name }}>
                {({ dragRef }) =>
                    dragRef(
                        <div>
                            <ListItem item={item} />
                        </div>
                    )
                }
            </Draggable>
        ))}
    </div>
);
