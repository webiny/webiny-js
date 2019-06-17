// @flow
import * as React from "react";
import { pure } from "recompose";
import { withCms } from "webiny-app-cms/context";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import { get } from "lodash";
import { Form as FormsForm } from "webiny-app-forms/components/Form";

const FormElement = pure((props: Object) => {
    const { element } = props;
    const id = get(element, "data.settings.form");
    let render = <span>Nothing selected.</span>;
    if (id) {
        render = <FormsForm preview id={id} />;
    }

    return (
        <ElementRoot key={"form-" + id} element={element} className={"webiny-cms-element-form"}>
            {render}
        </ElementRoot>
    );
});

export default withCms()(FormElement);
