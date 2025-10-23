import React from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";

interface AddGroupProps {
    onClick: () => void;
}

export const AddGroup = ({ onClick }: AddGroupProps) => {
    return (
        <div className={"mt-lg text-center"}>
            <Button
                onClick={onClick}
                text={"Add new filter group"}
                icon={<AddIcon />}
                variant={"secondary"}
            />
        </div>
    );
};
