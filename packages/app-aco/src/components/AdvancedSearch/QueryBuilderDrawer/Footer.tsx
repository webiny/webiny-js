import React from "react";

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

export const Footer = ({ formRef, onPersist, onClose, presenter }: FooterProps) => {
    const onSave = () => {
        presenter.onSave(queryObject => {
            onPersist(queryObject);
        });
    };

    return (
        <SimpleFormFooter>
            <div>
                <ButtonDefault onClick={onSave}>Save filter</ButtonDefault>
            </div>
            <div>
                <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
                <ButtonPrimary onClick={() => formRef.current?.submit()}>
                    Apply filter
                </ButtonPrimary>
            </div>
        </SimpleFormFooter>
    );
};
