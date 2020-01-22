import React from "react";
import { Form as FormsForm } from "@webiny/app-form-builder/components/Form";
import { get } from "lodash";

export default [
    {
        name: "pb-render-page-element-form",
        type: "pb-render-page-element",
        elementType: "form",
        render({ element }) {
            let render = <span>Cannot render form, ID missing.</span>;

            const form = get(element, "data.settings.form") || {
                revision: null
            };

            if (form.revision) {
                const props = {
                    parentId: null,
                    revisionId: null
                };

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
