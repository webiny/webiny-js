// @flow
import React from "react";
import { Form as FormsForm } from "webiny-app-forms/components/Form";
import { get } from "lodash";

export default [
    {
        name: "cms-render-element-form",
        type: "cms-render-element",
        element: "cms-element-form",
        render({ element }: Object) {
            let render = "Cannot render form, ID missing.";

            let form = get(element, "data.settings.form") || {};

            if (form.revision) {
                const props = {};

                if (form.revision === "latest") {
                    props.parent = form.parent;
                } else {
                    props.revision = form.revision;
                }

                render = <FormsForm {...props} />;
            }

            return render;
        }
    }
];
