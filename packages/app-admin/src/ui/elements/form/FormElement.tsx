import React, { Fragment } from "react";
import { Form, FormOnSubmit, FormRenderPropParams } from "@webiny/form";
import { UIElement, UIElementConfig, UiElementRenderProps } from "~/ui/UIElement";

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

export interface FormElementRenderProps extends UiElementRenderProps {
    formProps: FormRenderPropParams;
}

export class FormElement extends UIElement<FormElementConfig> {
    public constructor(id: string, config: FormElementConfig) {
        super(id, config);

        this.useGrid(false);
    }

    public override render(props: FormElementRenderProps): React.ReactNode {
        return (
            <Form onSubmit={this.config.onSubmit} data={this.config.getData()}>
                {formProps => <Fragment>{super.render({ ...props, formProps })}</Fragment>}
            </Form>
        );
    }
}
