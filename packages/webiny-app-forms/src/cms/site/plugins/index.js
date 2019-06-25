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
            const id = get(element, "data.settings.form");
            if (!id) {
                return <span>Cannot render form, ID missing.</span>;
            }

            return <FormsForm id={id} />;
        }
    }
];
