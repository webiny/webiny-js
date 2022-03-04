import React from "react";
import styled from "@emotion/styled";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { Form as FormsForm } from "../../../../components/Form";
import { PbEditorElement, PbElementDataSettingsFormType } from "@webiny/app-page-builder/types";
import useRenderEmptyEmbed from "@webiny/app-page-builder/editor/plugins/elements/utils/oembed/useRenderEmptyEmbed";

const Overlay = styled("div")({
    background: "black",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0.25
});

const renderContent = (form: PbElementDataSettingsFormType): JSX.Element => {
    const props = {
        preview: true,
        parentId: form.revision === "latest" ? form.parent : undefined,
        revisionId: form.revision === "latest" ? undefined : form.revision
    };

    return <FormsForm {...props} />;
};

export interface FormElementPropsType {
    element: PbEditorElement;
    isActive: boolean;
}

const FormElement: React.FC<FormElementPropsType> = ({ element, isActive }) => {
    const { form = {} } = element.data?.settings || {};

    const renderEmpty = useRenderEmptyEmbed(element);

    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-${form.parent}-${form.revision}`}
                element={element}
                className={"webiny-pb-element-form"}
            >
                {form.revision ? renderContent(form) : renderEmpty() || <></>}
            </ElementRoot>
        </>
    );
};

export default React.memo(FormElement);
