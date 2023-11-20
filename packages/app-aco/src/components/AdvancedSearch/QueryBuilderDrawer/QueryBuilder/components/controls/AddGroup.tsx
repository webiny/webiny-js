import React from "react";
import { ButtonDefault } from "@webiny/ui/Button";
import { AddGroupInner, ButtonIcon } from "../../Querybuilder.styled";

interface AddGroupProps {
    onClick: () => void;
}

export const AddGroup = ({ onClick }: AddGroupProps) => {
    return (
        <AddGroupInner>
            <ButtonDefault onClick={onClick}>
                <ButtonIcon /> {"Add new filter group"}
            </ButtonDefault>
        </AddGroupInner>
    );
};
