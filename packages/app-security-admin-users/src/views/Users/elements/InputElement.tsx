import React from "react";
import { FormRenderPropParams } from "@webiny/form";
import { Element, ElementConfig } from "./Element";
import { Input } from "@webiny/ui/Input";

export interface InputConfig extends ElementConfig {
    label: string;
    validators?: Function;
}

export class InputElement extends Element<InputConfig> {
    protected _disabled = false;

    setDisabled(disabled: boolean) {
        this._disabled = disabled;
    }

    render({ formProps, viewProps }: any): React.ReactElement<any> {
        const { Bind } = formProps as FormRenderPropParams;

        return (
            <Bind name={this.id} validators={this._config.validators}>
                <Input label={this._config.label} disabled={this._disabled} />
            </Bind>
        );
    }
}
