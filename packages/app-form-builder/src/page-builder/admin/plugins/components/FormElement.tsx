import React from "react";
import styled from "@emotion/styled";
import { uiAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { Form as FormsForm } from "@webiny/app-form-builder/components/Form";
import { PbElement } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const Overlay = styled("div")({
    background: "black",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0.25
});

export type FormElementPropsType = {
    element: PbElement;
};

const FormElement: React.FunctionComponent<FormElementPropsType> = ({ element }) => {
    const { activeElement } = useRecoilValue(uiAtom);
    const isActive = activeElement === element.id;
    let render = <span>Form not selected.</span>;

    const form = element.data?.settings?.form || {};

    if (form.revision) {
        const props = {
            preview: true,
            parentId: undefined,
            revisionId: undefined
        };

        if (form.revision === "latest") {
            props.parentId = form.parent;
        } else {
            props.revisionId = form.revision;
        }

        render = <FormsForm {...props} />;
    }

    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-${form.parent}-${form.revision}`}
                element={element}
                className={"webiny-pb-element-form"}
            >
                {render}
            </ElementRoot>
        </>
    );
};

export default React.memo(FormElement);
