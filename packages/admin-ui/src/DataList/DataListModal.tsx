import React, { useState } from "react";
import { ReactComponent as Sort } from "@webiny/icons/sort.svg";
import { PopoverPrimitive } from "~/Popover/index.js";
import { withStaticProps } from "~/utils.js";
import { Tooltip } from "~/Tooltip/index.js";
import { IconButton } from "~/Button/index.js";

interface DataListModalContentProps {
    children: React.ReactNode;
}

const DataListModalContent = ({ children }: DataListModalContentProps) => {
    return <div data-testid={"data-list-modal-wrapper"}>{children}</div>;
};

interface DataListModalTriggerProps {
    "data-testid"?: string;
    icon?: React.ReactElement;
}

const DataListModalTrigger = ({ icon = <Sort />, ...props }: DataListModalTriggerProps) => {
    return <IconButton icon={icon} variant={"ghost"} {...props} size={"sm"} />;
};

interface DataListModalProps {
    trigger: React.ReactElement;
    content: React.ReactElement;
}

const BaseDataListModal = (props: DataListModalProps) => {
    const [open, setOpen] = useState<boolean>(false);

    if (!props.content || !props.trigger) {
        return null;
    }

    return (
        <PopoverPrimitive open={open} onOpenChange={open => setOpen(open)}>
            <Tooltip
                trigger={
                    <PopoverPrimitive.Trigger asChild>
                        <span>{props.trigger}</span>
                    </PopoverPrimitive.Trigger>
                }
                content={"Sort list"}
            />
            <PopoverPrimitive.Content onOpenAutoFocus={e => e.preventDefault()} align={"end"}>
                <div className={"bg-neutral-elevated p-md"}>{props.content}</div>
            </PopoverPrimitive.Content>
        </PopoverPrimitive>
    );
};

const DataListModal = withStaticProps(BaseDataListModal, {
    Trigger: DataListModalTrigger,
    Content: DataListModalContent
});

export {
    DataListModal,
    type DataListModalProps,
    type DataListModalContentProps,
    type DataListModalTriggerProps
};
