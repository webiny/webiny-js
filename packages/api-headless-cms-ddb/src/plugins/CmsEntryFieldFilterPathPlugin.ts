import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins/Plugin";
import { CmsModelField } from "@webiny/api-headless-cms/types";

export interface CreatePathCallableParams {
    field: CmsModelField;
    index?: number;
}
export interface CreatePathCallable {
    (params: CreatePathCallableParams): string;
}
export interface Params {
    fieldType: string;
    fieldId?: string[];
    path: string | CreatePathCallable;
}
export class CmsEntryFieldFilterPathPlugin extends Plugin {
    public static readonly type: string = "cms-field-filter-path";

    private readonly config: Params;

    public get fieldType(): string {
        return this.config.fieldType;
    }

    public constructor(config: Params) {
        super();

        this.config = config;

        this.name = `${(this.constructor as any).type}-${this.config.fieldType}`;
    }

    public canUse(field: CmsModelField): boolean {
        if (field.type !== this.config.fieldType) {
            return false;
        }
        if (Array.isArray(this.config.fieldId) === false || this.config.fieldId.length === 0) {
            return true;
        }
        return this.config.fieldId.includes(field.fieldId);
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
