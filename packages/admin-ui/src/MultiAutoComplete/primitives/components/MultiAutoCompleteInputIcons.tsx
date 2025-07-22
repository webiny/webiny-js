import React from "react";
import { ReactComponent as Close } from "@webiny/icons/close.svg";
import { ReactComponent as ChevronDown } from "@webiny/icons/keyboard_arrow_down.svg";
import { IconButton } from "~/Button";
import { Icon } from "~/Icon";
import { Loader } from "~/Loader";

interface MultiAutoCompleteInputIconsProps {
    displayResetAction: boolean;
    inputVariant?: "primary" | "secondary" | "ghost" | "ghost-negative" | null;
    inputSize?: "md" | "lg" | "xl" | null;
    loading?: boolean;
    disabled?: boolean;
    onOpenChange: (open: boolean) => void;
    onResetValue: () => void;
}

export const MultiAutoCompleteInputIcons = (props: MultiAutoCompleteInputIconsProps) => {
    return (
        <div className={"wby-flex wby-items-center wby-gap-sm"}>
            {props.loading && <Loader size={props.inputSize === "xl" ? "sm" : "xs"} />}
            {props.displayResetAction && (
                <IconButton
                    size={props.inputSize === "xl" ? "sm" : "xs"} // Map button size based on the input size.
                    variant={
                        props.inputVariant === "ghost-negative" ? "ghost-negative" : "secondary"
                    }
                    icon={
                        <Icon
                            icon={<Close />}
                            label={"Reset"}
                            color={
                                props.inputVariant === "ghost-negative"
                                    ? "neutral-negative"
                                    : "inherit"
                            }
                        />
                    }
                    disabled={props.disabled}
                    onClick={event => {
                        event.stopPropagation();
                        props.onResetValue();
                    }}
                />
            )}
            <Icon
                size={props.inputSize === "xl" ? "lg" : "sm"} // Map icon size based on the input size.
                icon={<ChevronDown />}
                label={"Open list"}
                onClick={event => {
                    event.stopPropagation();
                    props.onOpenChange(true);
                }}
            />
        </div>
    );
};
