import React from "react";
import { Separator } from "~/Separator";
import { makeDecoratable } from "~/utils";

interface ItemSubIndentationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    level: number;
}

const BaseItemSubIndentation = ({ level }: ItemSubIndentationProps) => {
    return (
        <div className={"wby-gap-x-xs wby-flex wby-mr-sm"}>
            {Array.from({ length: level }, (_, index) => (
                <div className={"wby-ml-md"} key={`sub-indentation-${level + index}`}>
                    <Separator
                        orientation={"vertical"}
                        margin={"none"}
                        variant={"strong"}
                        className={"wby-h-xl wby-ml-px"}
                    />
                </div>
            ))}
        </div>
    );
};

const ItemSubIndentation = makeDecoratable("TreeItemSubIndentation", BaseItemSubIndentation);

export { ItemSubIndentation, type ItemSubIndentationProps };
