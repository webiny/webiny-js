import React, { Fragment } from "react";
import { Form, FormOnSubmit } from "@webiny/form";
import { LayoutElement } from "~/views/Users/elements/LayoutElement";

export class FormElement extends LayoutElement<{ onSubmit: FormOnSubmit }> {
    constructor(id: string, config: any) {
        super(id, config);
    }

    render(viewProps: any) {
        console.log("FormElement.render", viewProps);
        return (
            <Form onSubmit={this._config.onSubmit}>
                {formProps => <Fragment>{super.render({ viewProps, formProps })}</Fragment>}
            </Form>
        );
    }
}
