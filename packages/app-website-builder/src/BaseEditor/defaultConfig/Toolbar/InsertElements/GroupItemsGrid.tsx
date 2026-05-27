import React from "react";
import type { ComponentGroupItem } from "@webiny/website-builder-sdk";
import { Draggable } from "~/BaseEditor/components/Draggable.js";
import { GridItem } from "./GridItem.js";

interface GroupItemsGridProps {
    items: ComponentGroupItem[];
}

export const GroupItemsGrid = ({ items }: GroupItemsGridProps) => (
    <div className={"grid grid-cols-3 gap-sm px-lg py-sm"} data-role={"group-items"}>
        {items.map(item => (
            <Draggable key={item.name} type="ELEMENT" item={{ componentName: item.name }}>
                {({ dragRef }) =>
                    dragRef(
                        <div>
                            <GridItem item={item} />
                        </div>
                    )
                }
            </Draggable>
        ))}
    </div>
);
