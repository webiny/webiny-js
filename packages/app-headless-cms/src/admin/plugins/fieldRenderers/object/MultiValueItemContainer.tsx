import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Accordion, IconButton } from "@webiny/admin-ui";
import type { GenericRecord } from "@webiny/app/types.js";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete_outline.svg";
import { ReactComponent as ArrowUp } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as ArrowDown } from "@webiny/icons/arrow_downward.svg";

export interface MultiValueItemContainerProps {
    value: GenericRecord<string>;
    isFirst: boolean;
    isLast: boolean;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onDelete: () => void;
    isExpanded: boolean;
    toggleExpanded: () => void;
    title: string;
    children: React.ReactNode;
}

export const MultiValueItemContainer = makeDecoratable(
    "MultiValueItemContainer",
    ({ children, ...props }: MultiValueItemContainerProps) => {
        const { onMoveUp, onMoveDown, onDelete, isLast, isFirst } = props;

        const actions = (
            <>
                <IconButton
                    icon={<ArrowDown />}
                    onClick={e => {
                        e.stopPropagation();
                        onMoveDown();
                    }}
                    variant="ghost"
                    disabled={isLast}
                />
                <IconButton
                    icon={<ArrowUp />}
                    onClick={e => {
                        e.stopPropagation();
                        onMoveUp();
                    }}
                    variant="ghost"
                    disabled={isFirst}
                />
                <Accordion.Item.Action.Separator />
                <IconButton
                    icon={<DeleteIcon />}
                    onClick={e => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    variant="ghost"
                />
            </>
        );

        return (
            <Accordion>
                <Accordion.Item
                    title={props.title}
                    actions={actions}
                    defaultOpen={props.isExpanded}
                >
                    {children}
                </Accordion.Item>
            </Accordion>
        );
    }
);
