import React from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface AddOperationProps {
    disabled: boolean;
    onClick: () => void;
}

export const AddOperation = ({ disabled, onClick }: AddOperationProps) => {
    return (
        <div className={"wby-mt-lg wby-text-center"}>
            <Button
                onClick={onClick}
                text={"Add new operation"}
                icon={<AddIcon />}
                variant={"secondary"}
                disabled={disabled}
            />
        </div>
    );
};
