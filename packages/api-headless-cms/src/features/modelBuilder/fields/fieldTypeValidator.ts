/**
 * Validator interface mixins for type-safe field validators.
 * These interfaces provide TypeScript autocomplete and type safety for field validation methods.
 */

export interface RequiredValidator {
    required(message?: string): this;
}

export interface MinLengthValidator {
    minLength(value: number, message?: string): this;
}

export interface MaxLengthValidator {
    maxLength(value: number, message?: string): this;
}

/**
 * Custom regex pattern validator.
 * For common patterns, use the preset validators below (email, url, etc.).
 */
export interface PatternValidator {
    pattern(regex: string, flags?: string, message?: string): this;
}

/**
 * Pattern preset validators.
 * These are convenience methods for common validation patterns.
 */
export interface EmailValidator {
    email(message?: string): this;
}

export interface UrlValidator {
    url(message?: string): this;
}

export interface LowerCaseValidator {
    lowerCase(message?: string): this;
}

export interface UpperCaseValidator {
    upperCase(message?: string): this;
}

export interface LowerCaseSpaceValidator {
    lowerCaseSpace(message?: string): this;
}

export interface UpperCaseSpaceValidator {
    upperCaseSpace(message?: string): this;
}

/**
 * Number comparison validators
 */
export interface GteValidator {
    gte(value: number, message?: string): this;
}

export interface LteValidator {
    lte(value: number, message?: string): this;
}

/**
 * Date/time comparison validators
 */
export interface DateGteValidator {
    dateGte(value: string, message?: string): this;
}

export interface DateLteValidator {
    dateLte(value: string, message?: string): this;
}

/**
 * Unique value validator (ensures field value is unique across entries)
 */
export interface UniqueValidator {
    unique(message?: string): this;
}

/**
 * List validators (for list fields).
 * These validate the array itself, not individual items.
 */
export interface ListMinLengthValidator {
    listMinLength(value: number, message?: string): this;
}

export interface ListMaxLengthValidator {
    listMaxLength(value: number, message?: string): this;
}

/**
 * Validators to use when building a custom field type
 */
export namespace FieldTypeValidator {
    export type Required = RequiredValidator;
    export type MinLength = MinLengthValidator;
    export type MaxLength = MaxLengthValidator;
    export type Pattern = PatternValidator;
    export type Email = EmailValidator;
    export type Url = UrlValidator;
    export type LowerCase = LowerCaseValidator;
    export type UpperCase = UpperCaseValidator;
    export type LowerCaseSpace = LowerCaseSpaceValidator;
    export type UpperCaseSpace = UpperCaseSpaceValidator;
    export type Gte = GteValidator;
    export type Lte = LteValidator;
    export type DateGte = DateGteValidator;
    export type DateLte = DateLteValidator;
    export type Unique = UniqueValidator;
    export type ListMinLength = ListMinLengthValidator;
    export type ListMaxLength = ListMaxLengthValidator;
}
