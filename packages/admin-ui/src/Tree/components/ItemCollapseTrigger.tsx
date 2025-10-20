import React from "react";
import { ReactComponent as ChevronRight } from "@webiny/icons/chevron_right.svg";
import { IconButton, type IconButtonProps } from "~/Button/index.js";
import { Loader } from "~/Loader/index.js";
import { Icon } from "~/Icon/index.js";
import { makeDecoratable, cn } from "~/utils.js";

interface ItemCollapseTriggerProps extends IconButtonProps {
    open?: boolean;
    loading?: boolean;
}

const BaseItemCollapseTrigger = ({ open, loading, ...props }: ItemCollapseTriggerProps) => {
    if (loading) {
        return <Loader size={"xs"} variant={"subtle"} />;
    }

    return (
        <IconButton
            {...props}
            size={"xs"}
            variant={"ghost"}
            icon={
                <Icon
                    icon={<ChevronRight />}
                    size="sm"
                    label={"Open / Close tree item"}
                    color={"neutral-strong"}
                    className={cn(
                        "transition transform duration-100 ease-linear",
                        open ? "rotate-90" : "rotate-0"
                    )}
                />
            }
        />
    );
};

const ItemCollapseTrigger = makeDecoratable("TreeItemCollapseTrigger", BaseItemCollapseTrigger);

export { ItemCollapseTrigger, type ItemCollapseTriggerProps };
