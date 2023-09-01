import React from "react";
import styled from "@emotion/styled";
import { SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { useForm } from "@webiny/form";

const SimpleFormFooterStyled = styled(SimpleFormFooter)`
    justify-content: flex-end;
`;

interface FooterProps {
    onClose: () => void;
}

export const Footer: React.VFC<FooterProps> = ({ onClose }) => {
    const form = useForm();

    return (
        <SimpleFormFooterStyled>
            <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
            <ButtonPrimary onClick={form.submit}>Apply filter</ButtonPrimary>
        </SimpleFormFooterStyled>
    );
};
