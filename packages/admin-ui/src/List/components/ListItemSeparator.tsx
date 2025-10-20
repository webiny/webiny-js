import * as React from "react";
import { makeDecoratable } from "~/utils.js";
import { Separator, type SeparatorProps } from "~/Separator/index.js";

type ListItemSeparatorProps = SeparatorProps;

const DecoratableListItemSeparator = (props: ListItemSeparatorProps) => {
    return <Separator orientation={"vertical"} className={"h-lg mx-sm-plus"} {...props} />;
};

const ListItemSeparator = makeDecoratable("ListItemSeparator", DecoratableListItemSeparator);

export { ListItemSeparator, type ListItemSeparatorProps };
