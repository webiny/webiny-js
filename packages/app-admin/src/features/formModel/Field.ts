import { makeAutoObservable, computed } from "mobx";
import type {
    IFieldConfig,
    IFieldVM,
    IFieldValidation,
    ISelectOption,
    IFormModel,
    IField,
    BeforeChangeCallback,
    AfterChangeCallback
} from "./abstractions.js";

/**
 * Runtime observable field. Holds value, validation state, and exposes a VM for renderers.
 */
export class Field implements IField {
    private _value: unknown;
    private _validation: IFieldValidation = { isValid: null };
    private _disabled: boolean;
    private _beforeChangeCallbacks: BeforeChangeCallback[] = [];
    private _afterChangeCallbacks: AfterChangeCallback[] = [];
    private _form: IFormModel | null = null;

    readonly config: IFieldConfig;

    constructor(config: IFieldConfig) {
        this.config = config;
        this._value = config.defaultValue ?? null;
        this._disabled = config.disabled;

        if (config.beforeChangeCallbacks) {
            this._beforeChangeCallbacks = [...config.beforeChangeCallbacks];
        }
        if (config.afterChangeCallbacks) {
            this._afterChangeCallbacks = [...config.afterChangeCallbacks];
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

    getValue(): unknown {
        return this._value;
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

    setForm(form: IFormModel): void {
        this._form = form;
    }

    get vm(): IFieldVM {
        const options = this._resolveOptions();

        return {
            name: this.config.name,
            type: this.config.type,
            label: this.config.label,
            placeholder: this.config.placeholder,
            value: this._value,
            validation: this._validation,
            required: this.config.required,
            disabled: this._disabled,
            renderer: this.config.renderer,
            options,
            onChange: (value: unknown) => this.setValue(value)
        };
    }

    private _resolveOptions(): ISelectOption[] | undefined {
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
                this._validation = {
                    isValid: false,
                    message: firstIssue?.message || "Invalid value."
                };
                return false;
            }
        }

        this._validation = { isValid: true };
        return true;
    }
}
