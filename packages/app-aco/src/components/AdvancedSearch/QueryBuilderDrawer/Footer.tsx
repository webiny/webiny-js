import React from "react";

import { observer } from "mobx-react-lite";
import { FormAPI } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

import { QueryObjectDTO } from "~/components/AdvancedSearch/QueryObject";
import { QueryBuilderPresenter } from "~/components/AdvancedSearch/QueryBuilderDrawer/QueryBuilder/adapters";

import { SimpleFormFooter } from "./QueryBuilderDrawer.styled";

interface FooterProps {
    onClose: () => void;
    formRef: React.RefObject<FormAPI>;
    onPersist: (data: QueryObjectDTO) => void;
    presenter: QueryBuilderPresenter;
}

export const Footer = observer(({ formRef, onPersist, onClose, presenter }: FooterProps) => {
    const viewModel = presenter.getViewModel();

    return (
        <SimpleFormFooter>
            <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
            <ButtonDefault onClick={() => onPersist(viewModel.queryObject)}>
                Save filter
            </ButtonDefault>
            <ButtonPrimary onClick={() => formRef.current?.submit()}>Apply filter</ButtonPrimary>
        </SimpleFormFooter>
    );
});
