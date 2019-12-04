// @flow
import React from "react";
import { Form as FormsForm } from "@webiny/app-forms/components/Form";
import { get } from "lodash";

export default [
    {
        name: "pb-render-page-element-form",
        type: "pb-render-page-element",
        elementType: "form",
        render({ element }: Object) {
            let render = "Cannot render form, ID missing.";

            let form = get(element, "data.settings.form") || {};

            if (form.revision) {
                const props = {};

                if (form.revision === "latest") {
                    props.parentId = form.parent;
                } else {
                    props.revisionId = form.revision;
                }

                render = <FormsForm {...props} />;
            }

            return render;
        }
    }
];
