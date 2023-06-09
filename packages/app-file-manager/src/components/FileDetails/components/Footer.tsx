import React from "react";
import styled from "@emotion/styled";
import { useFileDetails } from "~/components/FileDetails";
import { SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { useForm } from "@webiny/form";

const SimpleFormFooterStyled = styled(SimpleFormFooter)`
    justify-content: flex-end;
`;

export const Footer = () => {
    const { close } = useFileDetails();
    const form = useForm();

    return (
        <SimpleFormFooterStyled>
            <ButtonDefault onClick={close}>Cancel</ButtonDefault>
            <ButtonPrimary onClick={form.submit}>Save File</ButtonPrimary>
        </SimpleFormFooterStyled>
    );
};
