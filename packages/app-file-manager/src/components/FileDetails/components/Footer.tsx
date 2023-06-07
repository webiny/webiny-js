import React from "react";
import { useFileDetails } from "~/components/FileDetails";
import { SimpleFormFooter } from "@webiny/app-admin/components/SimpleForm";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { useForm } from "@webiny/form";

export const Footer = () => {
    const { close } = useFileDetails();
    const form = useForm();

    return (
        <SimpleFormFooter>
            <ButtonDefault onClick={close}>Cancel</ButtonDefault>
            <ButtonPrimary onClick={form.submit}>Save File</ButtonPrimary>
        </SimpleFormFooter>
    );
};
