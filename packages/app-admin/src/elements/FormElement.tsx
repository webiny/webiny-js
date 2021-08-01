import React, { Fragment } from "react";
import { Form, FormOnSubmit, FormRenderPropParams } from "@webiny/form";
import { UIElement, UIElementConfig } from "@webiny/ui-composer/UIElement";

interface FormElementConfig extends UIElementConfig {
    onSubmit: FormOnSubmit;
    getData(): Record<string, any>;
    getInvalidFields?(): Record<string, any>;
    isDisabled?(): boolean;
    onChange?: FormOnSubmit;
    onInvalid?: () => void;
    submitOnEnter?: boolean;
    validateOnFirstSubmit?: boolean;
}

export interface FormElementRenderProps {
    formProps: FormRenderPropParams;
}

export class FormElement extends UIElement<FormElementConfig> {
    constructor(id, config) {
        super(id, config);

        this.useGrid(false);
    }

    render(props) {
        return (
            <Form onSubmit={this.config.onSubmit} data={this.config.getData()}>
                {formProps => <Fragment>{super.render({ ...props, formProps })}</Fragment>}
            </Form>
        );
    }
}
