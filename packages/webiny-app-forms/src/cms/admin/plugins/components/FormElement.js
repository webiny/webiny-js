// @flow
import * as React from "react";
import { pure } from "recompose";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import { get } from "lodash";
import { Form as FormsForm } from "webiny-app-forms/components/Form";

const FormElement = pure(({ element }: Object) => {
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
            className={"webiny-cms-element-form"}
        >
            {render}
        </ElementRoot>
    );
});

export default FormElement;
