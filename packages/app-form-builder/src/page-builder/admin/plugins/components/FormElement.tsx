import React from "react";
import styled from "@emotion/styled";
import { uiAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { Form as FormsForm } from "@webiny/app-form-builder/components/Form";
import { PbElement, PbElementDataSettingsFormType } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const Overlay = styled("div")({
    background: "black",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0.25
});

const renderContent = (form: PbElementDataSettingsFormType): JSX.Element => {
    if (!form.revision) {
        return <span>Form not selected.</span>;
    }
    const props = {
        preview: true,
        parentId: form.revision === "latest" ? form.parent : undefined,
        revisionId: form.revision === "latest" ? undefined : form.revision
    };

    return <FormsForm {...props} />;
};

export type FormElementPropsType = {
    element: PbElement;
};

const FormElement: React.FunctionComponent<FormElementPropsType> = ({ element }) => {
    const { activeElement } = useRecoilValue(uiAtom);
    const isActive = activeElement === element.id;

    const { form = {} } = element.data?.settings || {};

    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-${form.parent}-${form.revision}`}
                element={element}
                className={"webiny-pb-element-form"}
            >
                {renderContent(form)}
            </ElementRoot>
        </>
    );
};

export default React.memo(FormElement);
