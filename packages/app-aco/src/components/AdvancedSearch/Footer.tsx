import React from "react";
import styled from "@emotion/styled";
import { SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { FormAPI } from "@webiny/form";

const SimpleFormFooterStyled = styled(SimpleFormFooter)`
    justify-content: flex-end;
`;

interface FooterProps {
    onClose: () => void;
    formRef: React.RefObject<FormAPI>;
}

export const Footer: React.VFC<FooterProps> = ({ formRef, onClose }) => {
    return (
        <SimpleFormFooterStyled>
            <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
            <ButtonPrimary onClick={() => formRef.current?.submit()}>Apply filter</ButtonPrimary>
        </SimpleFormFooterStyled>
    );
};
