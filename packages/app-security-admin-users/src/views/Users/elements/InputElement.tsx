import React from "react";
import { FormRenderPropParams, BindComponentProps } from "@webiny/form";
import { Element, ElementConfig } from "./Element";
import { Input } from "@webiny/ui/Input";

export interface InputConfig extends ElementConfig {
    label: string;
    validators?: Function;
    beforeChange?: BindComponentProps["beforeChange"];
    defaultValue?: any;
}

export interface InputRenderProps {
    formProps: FormRenderPropParams;
}

export class InputElement extends Element<InputConfig> {
    protected disabled = false;

    setDisabled(disabled: boolean) {
        this.disabled = disabled;
    }

    render({ formProps }: InputRenderProps): React.ReactElement<any> {
        const { Bind } = formProps;

        return (
            <Bind name={this.id} validators={this.config.validators}>
                <Input label={this.config.label} disabled={this.disabled} />
            </Bind>
        );
    }
}
