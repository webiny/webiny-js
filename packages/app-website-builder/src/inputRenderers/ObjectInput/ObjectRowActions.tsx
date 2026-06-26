import React from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as MoveUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as MoveDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";

interface ObjectRowActionsProps {
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
}

/**
 * The trailing reorder / remove controls shown on a list item row.
 */
export const ObjectRowActions = ({
    onMoveUp,
    onMoveDown,
    onRemove,
    canMoveUp,
    canMoveDown
}: ObjectRowActionsProps) => {
    return (
        <>
            <Button
                variant={"ghost"}
                size={"sm"}
                icon={<MoveUpIcon />}
                disabled={!canMoveUp}
                onClick={onMoveUp}
            />
            <Button
                variant={"ghost"}
                size={"sm"}
                icon={<MoveDownIcon />}
                disabled={!canMoveDown}
                onClick={onMoveDown}
            />
            <Button variant={"ghost"} size={"sm"} icon={<DeleteIcon />} onClick={onRemove} />
        </>
    );
};
