import React from "react";

import { FormAPI } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

import { FilterDTO } from "~/components/AdvancedSearch/domain";
import { QueryBuilderDrawerPresenter } from "./QueryBuilderDrawerPresenter";

import { SimpleFormFooter } from "./QueryBuilderDrawer.styled";

interface FooterProps {
    onClose: () => void;
    formRef: React.RefObject<FormAPI>;
    onPersist: (data: FilterDTO) => void;
    onValidationError: () => void;
    presenter: QueryBuilderDrawerPresenter;
}

export const Footer = ({
    formRef,
    onPersist,
    onClose,
    onValidationError,
    presenter
}: FooterProps) => {
    const onSave = () => {
        presenter.onSave(
            filter => {
                onPersist(filter);
            },
            () => {
                onValidationError();
            }
        );
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
