import React from "react";
import { useTenancy } from "@webiny/app-tenancy";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import PeForm from "./PeFormElement";
import { Element } from "@webiny/app-page-builder-elements/types";

interface FormProps {
    element: PbEditorElement;
    isActive: boolean;
}

const Form = (props: FormProps) => {
    const { tenant } = useTenancy();

    const { element, ...rest } = props;
    return <PeForm headers={{ "x-tenant": tenant }} element={element as Element} {...rest} />;
};

export default Form;
