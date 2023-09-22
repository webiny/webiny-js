import React from "react";
import styled from "@emotion/styled";
import { FormAPI } from "@webiny/form";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

import { SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";

const SimpleFormFooterStyled = styled(SimpleFormFooter)`
    justify-content: flex-end;
`;

interface FooterProps {
    onClose: () => void;
    formRef: React.RefObject<FormAPI>;
}

export const Footer = ({ formRef, onClose }: FooterProps) => {
    return (
        <SimpleFormFooterStyled>
            <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
            <ButtonPrimary onClick={() => formRef.current?.submit()}>Apply filter</ButtonPrimary>
        </SimpleFormFooterStyled>
    );
};
