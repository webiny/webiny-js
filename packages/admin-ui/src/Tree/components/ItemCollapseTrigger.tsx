import React from "react";
import { ReactComponent as ChevronRight } from "@webiny/icons/chevron_right.svg";
import { IconButton, type IconButtonProps } from "~/Button";
import { Loader } from "~/Loader";
import { Icon } from "~/Icon";
import { makeDecoratable, cn } from "~/utils";

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
                        "wby-transition wby-transform wby-duration-100 wby-ease-linear",
                        open ? "wby-rotate-90" : "wby-rotate-0"
                    )}
                />
            }
        />
    );
};

const ItemCollapseTrigger = makeDecoratable("TreeItemCollapseTrigger", BaseItemCollapseTrigger);

export { ItemCollapseTrigger, type ItemCollapseTriggerProps };
