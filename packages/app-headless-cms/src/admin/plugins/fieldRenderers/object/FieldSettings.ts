import { CmsModelField } from "@webiny/app-headless-cms-common/types";

const cache = new Map<CmsModelField, FieldSettings>();

/**
 * This class helps us handle the `field.settings` and encapsulate defaults, checks of undefined, etc.
 * We also want to prevent log spamming in the browser console, so we cache and reuse each instance
 * for every unique field object. That way, each instance can track its own state.
 */
export class FieldSettings {
    private readonly field: CmsModelField;
    private logged = false;

    private constructor(field: CmsModelField) {
        this.field = field;
    }

    getSettings() {
        return {
            ...this.field.settings,
            fields: this.field.settings?.fields || [],
            layout: this.field.settings?.layout || []
        };
    }

    hasFields() {
        if (!this.field.settings) {
            return false;
        }

        if (!this.field.settings.fields) {
            return false;
        }

        return this.field.settings.fields.length > 0;
    }

    logMissingFields() {
        if (this.logged) {
            return;
        }

        console.info(
            `Skipping "${this.field.fieldId}" field. There are no fields defined for this object.`
        );

        this.logged = true;
    }

    public static createFrom(field: CmsModelField): FieldSettings {
        if (cache.has(field)) {
            return cache.get(field) as FieldSettings;
        }

        cache.set(field, new FieldSettings(field));

        return cache.get(field) as FieldSettings;
    }
}
