import React from "react";
import { PbEditorElement } from "@webiny/app-page-builder/types";
import { get } from "lodash";
import { FormComponentPropsType } from "~/types";
import { Form as FormsForm } from "~/components/Form";

export interface FormElementPropsType {
    element: PbEditorElement;
}

const FormElement: React.FC<FormElementPropsType> = ({ element }) => {
    let render = <span>Cannot render form, ID missing.</span>;

    const form = get(element, "data.settings.form") || {
        revision: null
    };

    if (form.revision) {
        const props: FormComponentPropsType = {};

        if (form.revision === "latest") {
            props.parentId = form.parent;
        } else {
            props.revisionId = form.revision;
        }

        render = <FormsForm {...props} />;
    }

    return render;
};

export default React.memo(FormElement);
