import { FormRenderPropParams, Form } from "@webiny/form";
import { UIElement, UIElementConfig } from "@webiny/ui-composer/UIElement";

export interface FormFieldElementConfig<TRenderProps = FormRenderPropParams>
    extends UIElementConfig<TRenderProps> {
    name: string;
    validators?: Function;
    beforeChange?: BeforeChange;
    afterChange?: AfterChange;
    defaultValue?: any;
    isDisabled?: boolean | IsDisabled;
    label?: string;
    description?: string | React.ReactElement;
    placeholder?: string;
}

export interface FormFieldElementRenderProps {
    formProps: FormRenderPropParams;
}

interface IsDisabled {
    (props: FormFieldElementRenderProps): boolean;
}

interface BeforeChange {
    (value: any, callback: BeforeChangeCallback): void;
}

interface BeforeChangeCallback {
    (value: any): void;
}

interface AfterChange {
    (value: any, form: Form): void;
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

    getValidators() {
        return this.config.validators;
    }

    getDefaultValue() {
        return this.config.defaultValue;
    }

    getLabel() {
        return this.config.label;
    }

    getDescription() {
        return this.config.description;
    }

    getPlaceholder() {
        return this.config.placeholder;
    }

    setLabel(label: string) {
        this.config.label = label;
    }

    setDescription(description: string | React.ReactElement) {
        this.config.description = description;
    }

    setPlaceholder(placeholder: string) {
        this.config.placeholder = placeholder;
    }

    setDefaultValue(value: any) {
        this.config.defaultValue = value;
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

    setIsDisabled(isDisabled: boolean | IsDisabled) {
        this.config.isDisabled = isDisabled;
    }

    protected isDisabled(props: FormFieldElementRenderProps): boolean {
        if (typeof this.config.isDisabled === "function") {
            return this.config.isDisabled(props);
        }

        return this.config.isDisabled;
    }
}
