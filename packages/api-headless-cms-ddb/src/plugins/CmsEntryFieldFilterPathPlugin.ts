import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins/Plugin";
import { CmsModelField } from "@webiny/api-headless-cms/types";

export interface CreatePathCallableParams {
    field: Partial<CmsModelField> & Pick<CmsModelField, "fieldId" | "storageId" | "id">;
    index?: number;
}
export interface CreatePathCallable {
    (params: CreatePathCallableParams): string;
}
export interface CmsEntryFieldFilterPathPluginParams {
    fieldType: string;
    fieldId?: string[];
    path: string | CreatePathCallable;
    canUse?: (field: Pick<CmsModelField, "fieldId" | "type">, parents?: string[]) => boolean;
}
export class CmsEntryFieldFilterPathPlugin extends Plugin {
    public static override readonly type: string = "cms-field-filter-path";

    private readonly config: CmsEntryFieldFilterPathPluginParams;

    public get fieldType(): string {
        return this.config.fieldType;
    }

    public constructor(config: CmsEntryFieldFilterPathPluginParams) {
        super();

        this.config = config;

        /**
         * We expect error here because we know that `this.constructor.type` is defined, but TS does not.
         */
        // @ts-expect-error
        this.name = `${this.constructor.type}-${this.config.fieldType}`;
    }

    public canUse(field: Pick<CmsModelField, "fieldId" | "type">, parents: string[]): boolean {
        if (field.type !== this.config.fieldType) {
            return false;
        } else if (this.config.canUse) {
            return this.config.canUse(field, parents);
        }
        const fieldId = this.config.fieldId;
        if (!fieldId || Array.isArray(fieldId) === false || fieldId.length === 0) {
            return true;
        }
        return fieldId.includes(field.fieldId);
    }

    public createPath(params: CreatePathCallableParams): string {
        if (typeof this.config.path === "function") {
            return this.config.path(params);
        } else if (typeof this.config.path === "string") {
            return this.config.path;
        }
        throw new WebinyError(`Missing path in "${this.name}" plugin.`);
    }
}
