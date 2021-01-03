import React from "react";
import FormLoad from "./FormLoad";
import FormRender from "./FormRender";
import { FormComponentPropsType } from "@webiny/app-form-builder/types";

const Form: React.FC<FormComponentPropsType> = props => {
    if (props.data) {
        return <FormRender {...props} />;
    }

    if (props.parentId || props.revisionId) {
        return <FormLoad {...props} />;
    }

    return null;
};

export default Form;
