import React from "react";

import { FormAPI } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

import { SimpleFormFooter } from "./QueryBuilderDrawer.styled";

interface FooterProps {
    onClose: () => void;
    formRef: React.RefObject<FormAPI>;
    onSave: () => void;
}

export const Footer = (props: FooterProps) => {
    return (
        <SimpleFormFooter>
            <div>
                <ButtonDefault onClick={props.onSave}>Save filter</ButtonDefault>
            </div>
            <div>
                <ButtonDefault onClick={props.onClose}>Cancel</ButtonDefault>
                <ButtonPrimary onClick={() => props.formRef.current?.submit()}>
                    Apply filter
                </ButtonPrimary>
            </div>
        </SimpleFormFooter>
    );
};
