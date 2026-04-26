import { makeAutoObservable, computed, runInAction } from "mobx";
import type {
    IFieldConfig,
    IFieldVM,
    IFieldValidation,
    IValueOption,
    IFormModel,
    IField,
    IRule,
    FieldTypeMap,
    BeforeChangeCallback,
    AfterChangeCallback,
    AfterSetValueCallback,
    OnBlurCallback,
    RequiredWhenCallback,
    ComputedFieldCallback
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
    private _requiredWhenCallbacks: RequiredWhenCallback[] = [];
    private _computed: ComputedFieldCallback | null = null;
    private _computedUntilDirty: ComputedFieldCallback | null = null;
    /** Set once a computedUntilDirty field receives its first user edit. */
    private _computedOverridden = false;
    private _isUIChange = false;
    private _form: IFormModel | null = null;
    private _ancestorRules: IRule[] = [];

    readonly config: IFieldConfig;

    constructor(config: IFieldConfig) {
        this.config = config;
        const defaultValue =
            typeof config.defaultValue === "function"
                ? (config.defaultValue as () => unknown)()
                : config.defaultValue;
        this._value = defaultValue ?? (config.isList ? [] : null);
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
        if (config.requiredWhenCallbacks) {
            this._requiredWhenCallbacks = [...config.requiredWhenCallbacks];
        }
        if (config.computed) {
            this._computed = config.computed;
        } else if (config.computedUntilDirty) {
            this._computedUntilDirty = config.computedUntilDirty;
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
        if (this._computed && this._form) {
            return this._computed(this._form) as T;
        }
        if (this._computedUntilDirty && !this._computedOverridden && this._form) {
            return this._computedUntilDirty(this._form) as T;
        }
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
        if (this._computedUntilDirty && this._isUIChange) {
            this._computedOverridden = true;
        }

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
     * Set value directly without running pipelines. Used by setData() and reset().
     */
    setValueSilent(value: unknown): void {
        this._value = value;
        if (this._computedUntilDirty) {
            this._computedOverridden = value !== null && value !== undefined;
        }
    }

    setDisabled(value: boolean): void {
        this._disabled = value;
    }

    private _evaluateRules(): { visible: boolean; disabled: boolean } {
        if (!this._form) {
            return { visible: true, disabled: false };
        }
        const own = this.config.rules ?? [];
        const all = [...this._ancestorRules, ...own];
        if (all.length === 0) {
            return { visible: true, disabled: false };
        }
        return this._form.evaluateRules(all);
    }

    get visible(): boolean {
        if (this._hidden) {
            return false;
        }
        return this._evaluateRules().visible;
    }

    get disabled(): boolean {
        if (this._disabled) {
            return true;
        }
        return this._evaluateRules().disabled;
    }

    setVisible(value: boolean): void {
        this._hidden = !value;
    }

    setAncestorRules(rules: IRule[]): void {
        runInAction(() => {
            this._ancestorRules = rules;
        });
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

    addRequiredWhen(fn: (form: IFormModel) => boolean, message?: string): void {
        this._requiredWhenCallbacks.push({ fn, message });
    }

    setComputed(fn: ComputedFieldCallback): void {
        this._computed = fn;
        this._computedUntilDirty = null;
        this._computedOverridden = false;
    }

    setComputedUntilDirty(fn: ComputedFieldCallback): void {
        this._computedUntilDirty = fn;
        this._computed = null;
        this._computedOverridden = false;
    }

    /**
     * Effective `required` state — true if the built-in `.required()` flag is
     * set, or if any `requiredWhen()` callback returns `true` for the current
     * form state. The first truthy callback wins; its message is used.
     */
    resolveRequired(): { required: boolean; message?: string } {
        return this._resolveRequired();
    }

    private _resolveRequired(): { required: boolean; message?: string } {
        if (this.config.required) {
            return { required: true, message: this.config.requiredMessage };
        }
        if (this._form && this._requiredWhenCallbacks.length > 0) {
            for (const cb of this._requiredWhenCallbacks) {
                if (cb.fn(this._form)) {
                    return { required: true, message: cb.message };
                }
            }
        }
        return { required: false };
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
        const required = this._resolveRequired().required;

        return {
            name: this.config.name,
            type: this.config.type,
            label: this.config.label,
            help: this.config.help,
            description: this.config.description,
            note: this.config.note,
            placeholder: this.config.placeholder,
            value: this.getValue(),
            validation: this._validation,
            required,
            visible: this.visible,
            disabled: this.disabled,
            renderer: this.config.renderer,
            rendererSettings: this.config.rendererSettings,
            isList: !!this.config.isList,
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
     * Hidden fields are excluded from validation.
     */
    async validate(): Promise<boolean> {
        if (!this.visible) {
            runInAction(() => {
                this._validation = { isValid: null };
            });
            return true;
        }

        const effectiveValue = this.getValue();
        const requiredState = this._resolveRequired();

        // Required check
        if (requiredState.required) {
            const isEmpty =
                effectiveValue === null ||
                effectiveValue === undefined ||
                effectiveValue === "" ||
                (this.config.isList &&
                    Array.isArray(effectiveValue) &&
                    effectiveValue.length === 0);

            if (isEmpty) {
                this._validation = {
                    isValid: false,
                    message: requiredState.message || "This field is required."
                };
                return false;
            }
        }

        // Zod schema check
        if (this.config.schema) {
            const result = await this.config.schema.safeParseAsync(effectiveValue);
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

    /** True if this field has any computed callback configured. */
    get isComputed(): boolean {
        return this._computed !== null || this._computedUntilDirty !== null;
    }

    /** True if a computedUntilDirty field has been overridden by user edit. */
    get isComputedOverridden(): boolean {
        return this._computedOverridden;
    }
}
