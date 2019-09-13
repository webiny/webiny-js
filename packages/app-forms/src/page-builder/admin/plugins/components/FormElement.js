// @flow
import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { get } from "lodash";
import { Form as FormsForm } from "@webiny/app-forms/components/Form";
import { styled } from "@storybook/theming";

const Overlay = styled("div")({
    background: "black",
    border: "1px solid red",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 9,
    opacity: 0.25
});

const FormElement = React.memo(({ element, isActive }: Object) => {
    let render = "Form not selected.";

    let form = get(element, "data.settings.form") || {};

    if (form.revision) {
        const props = {
            preview: true,
            parent: undefined,
            revision: undefined
        };

        if (form.revision === "latest") {
            props.parent = form.parent;
        } else {
            props.revision = form.revision;
        }

        render = <FormsForm {...props} />;
    }

    return (
        <ElementRoot
            key={`form-${form.parent}-${form.revision}`}
            element={element}
            className={"webiny-pb-element-form"}
        >
            {isActive && <Overlay />}
            {render}
        </ElementRoot>
    );
});

export default FormElement;
