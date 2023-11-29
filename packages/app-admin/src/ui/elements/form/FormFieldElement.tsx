import React from "react";
import { FormRenderPropParams, FormAPI } from "@webiny/form";
import { UIElement, UIElementConfig } from "~/ui/UIElement";
import { FormElementRenderProps } from "~/ui/elements/form/FormElement";
import { Validator } from "@webiny/validation/types";

export interface FormFieldElementConfig<TRenderProps = FormRenderPropParams>
    extends UIElementConfig<TRenderProps> {
    name: string;
    validators?: GetterWithProps<Validator | Validator[]>;
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

interface AfterChange<T = any, D extends Record<string, any> = Record<string, any>> {
    (value: T, form: FormAPI<D>): void;
}

interface GetterWithProps<T> {
    (props: FormElementRenderProps): T;
}

export class FormFieldElement<
    TConfig extends FormFieldElementConfig = FormFieldElementConfig
> extends UIElement<TConfig> {
    private _beforeChange: BeforeChange[] = [];
    private _afterChange: AfterChange[] = [];

    public constructor(id: string, config: TConfig) {
        super(id, config);

        if (config.beforeChange) {
            this._beforeChange.push(config.beforeChange);
        }

        if (config.afterChange) {
            this._afterChange.push(config.afterChange);
        }

        this.applyPlugins(FormFieldElement);
    }

    public getName(): string {
        return this.config.name;
    }

    public getValidators(props?: FormFieldElementRenderProps): Validator | Validator[] {
        if (!this.config.validators || typeof this.config.validators !== "function") {
            return () => true;
        }

        return this.config.validators(props as FormFieldElementRenderProps);
    }

    public getDefaultValue(props?: FormFieldElementRenderProps): any {
        if (typeof this.config.defaultValue === "function") {
            return this.config.defaultValue(props);
        }

        return this.config.defaultValue;
    }

    public getLabel(props?: FormFieldElementRenderProps): string {
        if (typeof this.config.label === "function") {
            return this.config.label(props as FormFieldElementRenderProps);
        }

        return this.config.label as string;
    }

    public getDescription(props?: FormFieldElementRenderProps): string | React.ReactElement {
        if (typeof this.config.description === "function") {
            return this.config.description(props as FormFieldElementRenderProps);
        }

        return this.config.description as string;
    }

    public getPlaceholder(props?: FormFieldElementRenderProps): string {
        if (typeof this.config.placeholder === "function") {
            return this.config.placeholder(props as FormFieldElementRenderProps);
        }

        return this.config.placeholder as string;
    }

    public setLabel(label: string | GetterWithProps<string>): void {
        this.config.label = label;
    }

    public setDescription(
        description: string | React.ReactElement | GetterWithProps<string | React.ReactElement>
    ): void {
        this.config.description = description;
    }

    public setPlaceholder(placeholder: string | GetterWithProps<string>): void {
        this.config.placeholder = placeholder;
    }

    public setDefaultValue(value: any | GetterWithProps<any>): void {
        this.config.defaultValue = value;
    }

    public getIsDisabled(props?: FormFieldElementRenderProps): boolean {
        if (typeof this.config.isDisabled === "function") {
            return this.config.isDisabled(props as FormFieldElementRenderProps);
        }
        return this.config.isDisabled as boolean;
    }

    public setIsDisabled(isDisabled: boolean | GetterWithProps<boolean>): void {
        this.config.isDisabled = isDisabled;
    }

    public setValidators(validators: GetterWithProps<Validator>): void {
        this.config.validators = validators;
    }

    public onBeforeChange(value: string, cb: (value: string) => void): void {
        const callbacks = [...this._beforeChange];
        const next = (val: string) => {
            const callbackCallable = callbacks.pop();
            if (!callbackCallable) {
                cb(val);
                return;
            }
            callbackCallable(val, next);
        };

        next(value);
    }

    public onAfterChange(value: string, form: FormAPI): void {
        const callbacks = [...this._afterChange];
        const next = (val: string) => {
            const callbackCallable = callbacks.pop();
            if (!callbackCallable) {
                return;
            }
            callbackCallable(val, form);
        };

        next(value);
    }

    public addBeforeChange(cb: BeforeChange): void {
        this._beforeChange.push(cb);
    }

    public addAfterChange<T = any, D extends Record<string, any> = Record<string, any>>(
        cb: AfterChange<T, D>
    ): void {
        /**
         * TODO @ts-refactor possibly different subtype. Or so TS complains.
         */
        // @ts-expect-error
        this._afterChange.push(cb);
    }

    public setBeforeChange(cb: BeforeChange): void {
        this._beforeChange = [cb];
    }

    public setAfterChange(cb: AfterChange): void {
        this._afterChange = [cb];
    }
}
