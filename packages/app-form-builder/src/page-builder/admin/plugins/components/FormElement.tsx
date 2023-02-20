import React from "react";
import { useTenancy } from "@webiny/app-tenancy";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import PbForm from "./PbFormElement";
import PeForm from "./PeFormElement";
import { isLegacyRenderingEngine } from "~/utils";
import { Element } from "@webiny/app-page-builder-elements/types";

interface FormProps {
    element: PbEditorElement;
    isActive: boolean;
}

const Form: React.FC<FormProps> = props => {
    const { tenant } = useTenancy();
    if (isLegacyRenderingEngine) {
        return <PbForm {...props} />;
    }

    const { element, ...rest } = props;
    return <PeForm headers={{ "x-tenant": tenant }} element={element as Element} {...rest} />;
};

export default Form;
