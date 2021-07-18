import React, { Fragment } from "react";
import { Form, FormOnSubmit } from "@webiny/form";
import { Element, ElementConfig } from "~/views/Users/elements/Element";

interface Props<TViewProps = Record<string, any>> {
    viewProps: TViewProps;
}

interface FormElementConfig<TViewProps> extends ElementConfig {
    onSubmit(props: Props<TViewProps>): FormOnSubmit;
    getData(props: Props<TViewProps>): Record<string, any>;
    getInvalidFields?(props: Props<TViewProps>): Record<string, any>;
    isDisabled?(props: Props<TViewProps>): boolean;
    onChange?: FormOnSubmit;
    onInvalid?: () => void;
    submitOnEnter?: boolean;
    validateOnFirstSubmit?: boolean;
}

export class FormElement<TViewProps> extends Element<FormElementConfig<TViewProps>> {
    constructor(id, config) {
        super(id, config);

        this.toggleGrid(false);
    }
    render(props: Props<TViewProps>) {
        return (
            <Form onSubmit={this.config.onSubmit(props)} data={this.config.getData(props)}>
                {formProps => <Fragment>{super.render({ ...props, formProps })}</Fragment>}
            </Form>
        );
    }
}
