import WebinyError from "@webiny/error";
import structuredClone from "@ungap/structured-clone";
import {
    AcoContext,
    AcoSearchRecordCrudBase,
    CreateSearchRecordParams,
    IAcoApp,
    IAcoAppModifyFieldCallableCallback,
    IAcoAppParams,
    ListSearchRecordsParams,
    ListSearchRecordTagsParams,
    SearchRecord
} from "~/types";
import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import lodashUpperFirst from "lodash/upperFirst";
import lodashCamelCase from "lodash/camelCase";
import { DEFAULT_FIELDS } from "~/record/record.model";

const createApiName = (name: string) => {
    return lodashUpperFirst(lodashCamelCase(name));
};

export class AcoApp implements IAcoApp {
    public readonly name: string;
    public readonly context: AcoContext;
    public readonly model: CmsModel;
    private readonly fields: CmsModelField[];

    public get search(): AcoSearchRecordCrudBase {
        return {
            create: async <TData>(data: CreateSearchRecordParams<TData>) => {
                return this.context.aco.search.create<TData>(this.model, data);
            },
            update: async <TData>(id: string, data: SearchRecord<TData>) => {
                /**
                 * Required to have as any atm as TS is breaking on the return type.
                 */
                return (await this.context.aco.search.update<TData>(this.model, id, data)) as any;
            },
            get: async <TData>(id: string) => {
                return this.context.aco.search.get<TData>(this.model, id);
            },
            list: async <TData>(params: ListSearchRecordsParams) => {
                return this.context.aco.search.list<TData>(this.model, params);
            },
            delete: async (id: string): Promise<Boolean> => {
                return this.context.aco.search.delete(this.model, id);
            },
            listTags: async (params: ListSearchRecordTagsParams) => {
                return this.context.aco.search.listTags(this.model, params);
            }
        };
    }

    public get folder() {
        return this.context.aco.folder;
    }

    private constructor(context: AcoContext, params: IAcoAppParams) {
        this.context = context;
        this.name = params.name;
        this.model = structuredClone(params.model);
        /**
         * We can safely define the api name of the model as we control everything here.
         */
        this.model.name = `${this.model.name} ${this.name}`;
        this.model.modelId = `${this.model.modelId}-${this.name.toLowerCase()}`;
        const apiName = `AcoSearchRecord${createApiName(params.apiName)}`;
        this.model.singularApiName = apiName;
        this.model.pluralApiName = apiName;

        const index = this.model.fields.findIndex(f => f.fieldId === "data");
        if (index === -1) {
            throw new WebinyError(
                `The "data" field does not exist in model "${this.model.modelId}".`,
                "MODEL_DATA_FIELD_ERROR",
                {
                    modelId: this.model.modelId
                }
            );
        } else if (!this.model.fields[index].settings?.fields) {
            this.model.fields[index].settings!.fields = [];
        }
        this.fields = this.model.fields[index].settings!.fields as CmsModelField[];
        this.fields.push(...params.fields);
    }

    public static create(context: AcoContext, params: IAcoAppParams) {
        return new AcoApp(context, params);
    }

    public getFields(): CmsModelField[] {
        return this.fields;
    }

    public addField(field: CmsModelField): void {
        this.fields.push(field);
    }

    public removeField(id: string): void {
        if (DEFAULT_FIELDS.includes(id)) {
            throw new WebinyError(
                `Cannot remove the default field from the ACO App.`,
                "REMOVE_DEFAULT_FIELD_ERROR",
                {
                    fieldId: id
                }
            );
        }
        const index = this.fields.findIndex(field => field.id === id);
        if (index === -1) {
            return;
        }
        this.fields.splice(index, 1);
    }

    public modifyField(id: string, cb: IAcoAppModifyFieldCallableCallback): void {
        const index = this.fields.findIndex(field => field.id === id);
        if (index === -1) {
            throw new WebinyError(
                `There is no field "${id}" in app "${this.name}".`,
                "FIELD_NOT_FOUND_ERROR",
                {
                    id
                }
            );
        }
        this.fields[index] = cb(structuredClone(this.fields[index]));
    }
}
