import React from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface ObjectAddButtonProps {
    text?: string;
    onClick: () => void;
}

/**
 * The "Add" button shown below a list of object rows.
 */
export const ObjectAddButton = ({ text = "Add", onClick }: ObjectAddButtonProps) => {
    return (
        <div>
            <Button
                variant={"ghost"}
                size={"sm"}
                icon={<AddIcon />}
                text={text}
                onClick={onClick}
            />
        </div>
    );
};
