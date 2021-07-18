import React, { Fragment } from "react";
import { FormRenderPropParams } from "@webiny/form";
import { InputElement } from "./InputElement";

export class PasswordElement extends InputElement {
    render({ formProps }: any): React.ReactElement<any> {
        const { Bind } = formProps as FormRenderPropParams;

        return (
            <Bind name={this.id}>
                {({ value, onChange }) => (
                    <Fragment>
                        <label>{this.config.label}</label>
                        <input
                            type="password"
                            disabled={this.disabled}
                            value={value || ""}
                            onChange={e => onChange(e.target.value)}
                        />
                    </Fragment>
                )}
            </Bind>
        );
    }
}
