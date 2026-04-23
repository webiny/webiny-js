import { makeAutoObservable, computed, runInAction } from "mobx";
import type {
    IFieldConfig,
    IFieldVM,
    IFieldValidation,
    IValueOption,
    IFormModel,
    IField,
    FieldTypeMap,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback,
    OnBlurCallback
} from "./abstractions.js";

/**
 * Runtime observable field. Holds value, validation state, and exposes a VM for renderers.
 */
export class Field implements IField {
    private _value: unknown;
    private _validation: IFieldValidation = { isValid: null };
    private _disabled: boolean;
    private _hidden: boolean;
    private _beforeChangeCallbacks: BeforeChangeCallback[] = [];
    private _afterChangeCallbacks: AfterChangeCallback[] = [];
    private _afterSetValueCallbacks: AfterSetValueCallback[] = [];
    private _onBlurCallbacks: OnBlurCallback[] = [];
    private _isUIChange = false;
    private _form: IFormModel | null = null;

    readonly config: IFieldConfig;

    constructor(config: IFieldConfig) {
        this.config = config;
        this._value = config.defaultValue ?? null;
        this._disabled = config.disabled;
        this._hidden = config.hidden;

        if (config.beforeChangeCallbacks) {
            this._beforeChangeCallbacks = [...config.beforeChangeCallbacks];
        }
        if (config.afterChangeCallbacks) {
            this._afterChangeCallbacks = [...config.afterChangeCallbacks];
        }
        if (config.afterSetValueCallbacks) {
            this._afterSetValueCallbacks = [...config.afterSetValueCallbacks];
        }
        if (config.onBlurCallbacks) {
            this._onBlurCallbacks = [...config.onBlurCallbacks];
        }

        makeAutoObservable(this, {
            config: false,
            vm: computed
        });
    }

    get name(): string {
        return this.config.name;
    }

    get type(): string {
        return this.config.type;
    }

    getValue<T = unknown>(): T {
        return this._value as T;
    }

    /**
     * Set value with beforeChange/afterChange pipeline.
     * beforeChange always runs (pure transform).
     * afterChange only fires when value actually changed.
     */
    setValue(raw: unknown): void {
        let transformed = raw;
        for (const cb of this._beforeChangeCallbacks) {
            transformed = cb(transformed, this._form!);
        }

        if (transformed === this._value) {
            return;
        }

        this._value = transformed;

        for (const cb of this._afterChangeCallbacks) {
            cb(transformed, this._form!);
        }

        if (!this._isUIChange) {
            for (const cb of this._afterSetValueCallbacks) {
                cb(transformed, this._form!);
            }
        }
    }

    /**
     * Set value directly without running pipelines. Used by setData().
     */
    setValueSilent(value: unknown): void {
        this._value = value;
    }

    setDisabled(value: boolean): void {
        this._disabled = value;
    }

    get visible(): boolean {
        return !this._hidden;
    }

    setVisible(value: boolean): void {
        this._hidden = !value;
    }

    setValidation(validation: IFieldValidation): void {
        this._validation = validation;
    }

    resetValidation(): void {
        this._validation = { isValid: null };
    }

    addBeforeChange(cb: BeforeChangeCallback): void {
        this._beforeChangeCallbacks.push(cb);
    }

    addAfterChange(cb: AfterChangeCallback): void {
        this._afterChangeCallbacks.push(cb);
    }

    addAfterSetValue(cb: AfterSetValueCallback): void {
        this._afterSetValueCallbacks.push(cb);
    }

    addOnBlur(cb: OnBlurCallback): void {
        this._onBlurCallbacks.push(cb);
    }

    blur(): void {
        for (const cb of this._onBlurCallbacks) {
            cb(this._value, this._form!);
        }
    }

    setForm(form: IFormModel): void {
        this._form = form;
    }

    as<T extends keyof FieldTypeMap>(type: T): FieldTypeMap[T] {
        if (this.config.type !== type) {
            throw new Error(
                `Field "${this.config.name}" is type "${this.config.type}", not "${type}".`
            );
        }
        return this as unknown as FieldTypeMap[T];
    }

    remove(): void {
        if (!this._form) {
            throw new Error(`Field "${this.config.name}" is not attached to a form.`);
        }
        (this._form as any).removeField(this.config.name);
    }

    get vm(): IFieldVM {
        const options = this._resolveOptions();

        return {
            name: this.config.name,
            type: this.config.type,
            label: this.config.label,
            help: this.config.help,
            description: this.config.description,
            note: this.config.note,
            placeholder: this.config.placeholder,
            value: this._value,
            validation: this._validation,
            required: this.config.required,
            disabled: this._disabled,
            renderer: this.config.renderer,
            rendererSettings: this.config.rendererSettings,
            options,
            onChange: (value: unknown) => this._setValueFromUI(value),
            onBlur: () => this.blur()
        };
    }

    private _setValueFromUI(value: unknown): void {
        this._isUIChange = true;
        try {
            this.setValue(value);
        } finally {
            this._isUIChange = false;
        }
    }

    private _resolveOptions(): IValueOption[] | undefined {
        if (!this.config.options) {
            return undefined;
        }
        if (typeof this.config.options === "function") {
            return this.config.options(this._form!);
        }
        return this.config.options;
    }

    /**
     * Validate this field. Returns true if valid.
     * Validation order: required check → zod schema.
     */
    async validate(): Promise<boolean> {
        // Required check
        if (this.config.required) {
            const value = this._value;
            if (value === null || value === undefined || value === "") {
                this._validation = {
                    isValid: false,
                    message: this.config.requiredMessage || "This field is required."
                };
                return false;
            }
        }

        // Zod schema check
        if (this.config.schema) {
            const result = await this.config.schema.safeParseAsync(this._value);
            if (!result.success) {
                const firstIssue = result.error.issues[0];
                runInAction(() => {
                    this._validation = {
                        isValid: false,
                        message: firstIssue?.message || "Invalid value."
                    };
                });
                return false;
            }
        }

        runInAction(() => {
            this._validation = { isValid: true };
        });
        return true;
    }
}
