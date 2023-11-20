import React from "react";

import { ButtonDefault } from "@webiny/ui/Button";

import { AddOperationInner } from "~/components/BulkActions/ActionEdit/ActionEdit.styled";
import { ButtonIcon } from "@webiny/app-aco/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/Querybuilder.styled";

interface AddOperationProps {
    onClick: () => void;
}

export const AddOperation = ({ onClick }: AddOperationProps) => {
    return (
        <AddOperationInner>
            <ButtonDefault onClick={onClick}>
                <ButtonIcon /> {"Add new filter group"}
            </ButtonDefault>
        </AddOperationInner>
    );
};
