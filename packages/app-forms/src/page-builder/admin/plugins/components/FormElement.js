// @flow
import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { get } from "lodash";
import { Form as FormsForm } from "@webiny/app-forms/components/Form";
import styled from "@emotion/styled";
import { connect } from "react-redux";
import { getActiveElementId } from "@webiny/app-page-builder/editor/selectors";

const Overlay = styled("div")({
    background: "black",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0.25
});

const FormElement = (props: Object) => {
    const { element, isActive } = props;
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

export default connect((state, props) => {
    return {
        isActive: getActiveElementId(state) === props.element.id
    };
})(FormElement);
