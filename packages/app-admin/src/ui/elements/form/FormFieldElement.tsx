import React from "react";
import { FormRenderPropParams, FormAPI } from "@webiny/form";
import { UIElement, UIElementConfig } from "~/ui/UIElement";
import { FormElementRenderProps } from "~/ui/elements/form/FormElement";

export interface FormFieldElementConfig<TRenderProps = FormRenderPropParams>
    extends UIElementConfig<TRenderProps> {
    name: string;
    validators?: GetterWithProps<Function | Function[]>;
    beforeChange?: BeforeChange;
    afterChange?: AfterChange;
    defaultValue?: any | GetterWithProps<any>;
    isDisabled?: boolean | GetterWithProps<boolean>;
    label?: string | GetterWithProps<string>;
    description?: string | React.ReactElement | GetterWithProps<string | React.ReactElement>;
    placeholder?: string | GetterWithProps<string>;
}

export interface FormFieldElementRenderProps {
    formProps: FormRenderPropParams;
}

interface BeforeChange {
    (value: any, callback: BeforeChangeCallback): void;
}

interface BeforeChangeCallback {
    (value: any): void;
}

interface AfterChange {
    (value: any, form: FormAPI): void;
}

interface GetterWithProps<T> {
    (props: FormElementRenderProps): T;
}

export class FormFieldElement<
    TConfig extends FormFieldElementConfig = FormFieldElementConfig
> extends UIElement<TConfig> {
    private _beforeChange: BeforeChange[] = [];
    private _afterChange: AfterChange[] = [];

    constructor(id: string, config: TConfig) {
        super(id, config);

        if (config.beforeChange) {
            this._beforeChange.push(config.beforeChange);
        }

        if (config.afterChange) {
            this._afterChange.push(config.afterChange);
        }

        this.applyPlugins(FormFieldElement);
    }

    getName() {
        return this.config.name;
    }

    getValidators(props?: FormFieldElementRenderProps): Function | Function[] {
        if (!this.config.validators || typeof this.config.validators !== "function") {
            return () => true;
        }

        return this.config.validators(props);
    }

    getDefaultValue(props?: FormFieldElementRenderProps): any {
        if (typeof this.config.defaultValue === "function") {
            return this.config.defaultValue(props);
        }

        return this.config.defaultValue;
    }

    getLabel(props?: FormFieldElementRenderProps): string {
        if (typeof this.config.label === "function") {
            return this.config.label(props);
        }

        return this.config.label;
    }

    getDescription(props?: FormFieldElementRenderProps): string | React.ReactElement {
        if (typeof this.config.description === "function") {
            return this.config.description(props);
        }

        return this.config.description;
    }

    getPlaceholder(props?: FormFieldElementRenderProps): string {
        if (typeof this.config.placeholder === "function") {
            return this.config.placeholder(props);
        }

        return this.config.placeholder;
    }

    setLabel(label: string | GetterWithProps<string>) {
        this.config.label = label;
    }

    setDescription(
        description: string | React.ReactElement | GetterWithProps<string | React.ReactElement>
    ) {
        this.config.description = description;
    }

    setPlaceholder(placeholder: string | GetterWithProps<string>) {
        this.config.placeholder = placeholder;
    }

    setDefaultValue(value: any | GetterWithProps<any>) {
        this.config.defaultValue = value;
    }

    getIsDisabled(props?: FormFieldElementRenderProps) {
        if (typeof this.config.isDisabled === "function") {
            return this.config.isDisabled(props);
        }
        return this.config.isDisabled;
    }

    setIsDisabled(isDisabled: boolean | GetterWithProps<boolean>) {
        this.config.isDisabled = isDisabled;
    }

    setValidators(validators: GetterWithProps<Function>) {
        this.config.validators = validators;
    }

    onBeforeChange(value, cb) {
        const callbacks = [...this._beforeChange];
        const next = value => {
            if (!callbacks.length) {
                cb(value);
                return;
            }
            callbacks.pop()(value, next);
        };

        next(value);
    }

    onAfterChange(value, form) {
        const callbacks = [...this._afterChange];
        const next = value => {
            if (!callbacks.length) {
                return;
            }
            callbacks.pop()(value, form);
        };

        next(value);
    }

    addBeforeChange(cb: BeforeChange) {
        this._beforeChange.push(cb);
    }

    addAfterChange(cb: AfterChange) {
        this._afterChange.push(cb);
    }

    setBeforeChange(cb: BeforeChange) {
        this._beforeChange = [cb];
    }

    setAfterChange(cb: AfterChange) {
        this._afterChange = [cb];
    }
}
