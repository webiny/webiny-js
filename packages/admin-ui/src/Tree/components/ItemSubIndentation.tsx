import React from "react";
import { Separator } from "~/Separator/index.js";
import { makeDecoratable } from "~/utils.js";

interface ItemSubIndentationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
    level: number;
}

const BaseItemSubIndentation = ({ level }: ItemSubIndentationProps) => {
    return (
        <div className={"gap-x-xs flex mr-sm"}>
            {Array.from({ length: level }, (_, index) => (
                <div className={"ml-md"} key={`sub-indentation-${level + index}`}>
                    <Separator
                        orientation={"vertical"}
                        margin={"none"}
                        variant={"strong"}
                        className={"h-xl ml-px"}
                    />
                </div>
            ))}
        </div>
    );
};

const ItemSubIndentation = makeDecoratable("TreeItemSubIndentation", BaseItemSubIndentation);

export { ItemSubIndentation, type ItemSubIndentationProps };
