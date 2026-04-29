import * as React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import type { IconButtonProps } from "~/Button/index.js";
import { IconButton } from "~/Button/index.js";
import { ListItemSeparator } from "./ListItemSeparator.js";

type ListItemActionProps = IconButtonProps;

const DecoratableListItemAction = (props: ListItemActionProps) => {
    return <IconButton variant={"ghost"} size={"sm"} {...props} />;
};

const ListItemAction = withStaticProps(
    makeDecoratable("ListItemAction", DecoratableListItemAction),
    {
        Separator: ListItemSeparator
    }
);

export { ListItemAction, type ListItemActionProps };
