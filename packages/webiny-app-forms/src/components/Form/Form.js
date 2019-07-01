// @flow
// $FlowFixMe
import React from "react";
import FormLoad from "./FormLoad";
import FormRender from "./FormRender";
import type { FormComponentPropsType } from "webiny-app-forms/types";

const Form = (props: FormComponentPropsType) => {
    if (props.data) {
        return <FormRender {...props} />;
    }

    return <FormLoad {...props} />;
};

export default Form;
