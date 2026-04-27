import * as React from "react";
import { ReactComponent as DragHandleIcon } from "@webiny/icons/drag_indicator.svg";
import { makeDecoratable } from "~/utils.js";
import type { IconProps } from "~/Icon/index.js";
import { Icon } from "~/Icon/index.js";

interface ListItemHandleProps extends Omit<IconProps, "icon" | "label"> {
    icon?: React.ReactElement;
    label?: string;
}

const DecoratableListItemHandle = (props: ListItemHandleProps) => {
    return (
        <Icon
            size={"md"}
            color={"neutral-light"}
            className={"mx-xxs cursor-grab"}
            icon={<DragHandleIcon />}
            label={"Drag handle"}
            {...props}
        />
    );
};

const ListItemHandle = makeDecoratable("ListItemHandle", DecoratableListItemHandle);

export { ListItemHandle, type ListItemHandleProps };
