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
    HiddenWhenCallback,
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
    private _hiddenWhenCallbacks: HiddenWhenCallback[] = [];
    private _computed: ComputedFieldCallback | null = null;
    private _computedUntilDirty: ComputedFieldCallback | null = null;
    /** Set once a computedUntilDirty field receives its first user edit. */
    private _computedOverridden = false;
    private _validating = false;
    private _validationCacheKey: string | undefined = undefined;
    private _validationCache: boolean | undefined = undefined;
    private _isUIChange = false;
    private _focusRequested = false;
    private _qualifiedName: string = "";
    private _form: IFormModel | null = null;
    private _ancestorRules: IRule[] = [];

    readonly config: IFieldConfig;

    constructor(config: IFieldConfig) {
        this.config = config;
        this._qualifiedName = config.name;
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
        if (config.hiddenWhenCallbacks) {
            this._hiddenWhenCallbacks = [...config.hiddenWhenCallbacks];
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
        let transformed = this.config.normalizeValue
            ? this._applyNormalizeValue(raw, this.config.normalizeValue)
            : raw;
        for (const cb of this._beforeChangeCallbacks) {
            transformed = cb(transformed, this._form!);
        }

        if (transformed === this._value) {
            return;
        }

        const wasComputed = this._computedUntilDirty && !this._computedOverridden && this._form;
        const computedValue = wasComputed ? this._computedUntilDirty!(this._form!) : undefined;

        this._value = transformed;
        if (this._computedUntilDirty && this._isUIChange) {
            if (!wasComputed || transformed !== computedValue) {
                this._computedOverridden = true;
            }
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
        const parsed = this.config.normalizeValue
            ? this._applyNormalizeValue(value, this.config.normalizeValue)
            : value;
        this._value = parsed;
        if (this._computedUntilDirty) {
            this._computedOverridden = parsed !== null && parsed !== undefined;
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
        if (this._form && this._hiddenWhenCallbacks.length > 0) {
            for (const cb of this._hiddenWhenCallbacks) {
                if (cb(this._form)) {
                    return false;
                }
            }
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
        this._validationCacheKey = undefined;
        this._validationCache = undefined;
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

    setForm(form: IFormModel, parentPath?: string): void {
        this._form = form;
        this._qualifiedName = parentPath ? `${parentPath}.${this.config.name}` : this.config.name;
    }

    get qualifiedName(): string {
        return this._qualifiedName;
    }

    focus(): void {
        if (!this._form) {
            throw new Error(`Field "${this.config.name}" is not attached to a form.`);
        }
        this._form.focusField(this._qualifiedName);
    }

    requestFocus(): void {
        this._focusRequested = true;
    }

    clearFocusRequest(): void {
        this._focusRequested = false;
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
            validating: this._validating,
            required,
            visible: this.visible,
            disabled: this.disabled,
            renderer: this.config.renderer,
            rendererSettings: this.config.rendererSettings,
            isList: !!this.config.isList,
            options,
            onChange: (value: unknown) => this._setValueFromUI(value),
            onBlur: () => {
                if (this._form?.submitted) {
                    void this.validate();
                }
                this.blur();
            },
            addItem: (value?: unknown) => this._addItem(value),
            removeItem: (index: number) => this._removeItem(index),
            focusRequested: this._focusRequested,
            clearFocusRequest: () => this.clearFocusRequest()
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

    private _applyNormalizeValue(value: unknown, normalizeValue: (v: unknown) => unknown): unknown {
        if (this.config.isList && Array.isArray(value)) {
            return value.map(item => normalizeValue(item));
        }
        return normalizeValue(value);
    }

    private _addItem(value?: unknown): void {
        const current = Array.isArray(this._value) ? this._value : [];
        this._setValueFromUI([...current, value ?? null]);
    }

    private _removeItem(index: number): void {
        const current = Array.isArray(this._value) ? this._value : [];
        this._setValueFromUI(current.filter((_: unknown, i: number) => i !== index));
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
     *
     * Pass `{ force: true }` to bypass the memoization cache (used by
     * `form.validate()` / `form.submit()`). Blur-triggered validation
     * omits the flag so unchanged values return the cached result.
     */
    async validate(options?: { force?: boolean }): Promise<boolean> {
        if (!this.visible) {
            runInAction(() => {
                this._validation = { isValid: null };
            });
            return true;
        }

        const effectiveValue = this.getValue();

        // Memoization: return cached result when value hasn't changed.
        if (!options?.force && this._validationCache !== undefined) {
            const cacheKey = this._serializeValue(effectiveValue);
            if (this._validationCacheKey === cacheKey) {
                return this._validationCache;
            }
        }

        runInAction(() => {
            this._validating = true;
        });

        try {
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
                    const cacheKey = this._serializeValue(effectiveValue);
                    runInAction(() => {
                        this._validation = {
                            isValid: false,
                            message: requiredState.message || "This field is required."
                        };
                        this._validationCacheKey = cacheKey;
                        this._validationCache = false;
                    });
                    return false;
                }
            }

            // Zod schema check
            if (this.config.schema) {
                const result = await this.config.schema.safeParseAsync(effectiveValue);
                if (!result.success) {
                    const firstIssue = result.error.issues[0];
                    const cacheKey = this._serializeValue(effectiveValue);
                    runInAction(() => {
                        this._validation = {
                            isValid: false,
                            message: firstIssue?.message || "Invalid value."
                        };
                        this._validationCacheKey = cacheKey;
                        this._validationCache = false;
                    });
                    return false;
                }
            }

            const cacheKey = this._serializeValue(effectiveValue);
            runInAction(() => {
                this._validation = { isValid: true };
                this._validationCacheKey = cacheKey;
                this._validationCache = true;
            });
            return true;
        } finally {
            runInAction(() => {
                this._validating = false;
            });
        }
    }

    private _serializeValue(value: unknown): string {
        try {
            return JSON.stringify(value);
        } catch {
            return String(Math.random());
        }
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
