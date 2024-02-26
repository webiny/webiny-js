import React from "react";
import FormLoad from "./FormLoad";
import FormRender from "./FormRender";
import { FormComponentPropsType } from "~/types";

const Form = (props: FormComponentPropsType) => {
    if (props.data) {
        return <FormRender {...props} />;
    }

    if (props.parentId || props.revisionId) {
        return <FormLoad {...props} />;
    }

    return null;
};

export default Form;
