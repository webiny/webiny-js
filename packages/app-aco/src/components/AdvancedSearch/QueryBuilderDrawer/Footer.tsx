import React from "react";

import { FormAPI } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { QueryBuilderViewModel } from "~/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/adapters";

import { SimpleFormFooter } from "./QueryBuilderDrawer.styled";

interface FooterProps {
    onClose: () => void;
    formRef: React.RefObject<FormAPI>;
    onPersist: (data: QueryObjectDTO) => void;
    viewModel: QueryBuilderViewModel;
}

export const Footer = ({ formRef, onPersist, onClose, viewModel }: FooterProps) => {
    return (
        <SimpleFormFooter>
            <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
            <ButtonDefault onClick={() => onPersist(viewModel.queryObject)}>
                Save filter
            </ButtonDefault>
            <ButtonPrimary onClick={() => formRef.current?.submit()}>Apply filter</ButtonPrimary>
        </SimpleFormFooter>
    );
};
