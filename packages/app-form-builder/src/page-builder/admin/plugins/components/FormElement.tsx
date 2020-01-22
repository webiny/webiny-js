import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { get } from "lodash";
import { Form as FormsForm } from "@webiny/app-form-builder/components/Form";
import styled from "@emotion/styled";
import { connect } from "react-redux";
import { getActiveElementId } from "@webiny/app-page-builder/editor/selectors";
import { PbElement } from "@webiny/app-page-builder/types";

const Overlay = styled("div")({
    background: "black",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0.25
});

export type FormElementProps = {
    isActive: boolean;
    element: PbElement;
};

const FormElement = (props: FormElementProps) => {
    const { element, isActive } = props;
    let render = <span>Form not selected.</span>;

    const form = get(element, "data.settings.form") || {};

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

export default connect((state, props: any) => {
    return {
        isActive: getActiveElementId(state) === props.element.id
    };
})(FormElement);
