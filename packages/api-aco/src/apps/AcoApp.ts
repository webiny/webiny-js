import WebinyError from "@webiny/error";
import structuredClone from "@ungap/structured-clone";
import { IAcoApp, IAcoAppParams } from "~/apps/types";
import {
    AcoContext,
    AcoSearchRecordCrudBase,
    CreateSearchRecordParams,
    ListSearchRecordsParams,
    SearchRecord
} from "~/types";
import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

export class AcoApp implements IAcoApp {
    public readonly name: string;
    public readonly context: AcoContext;
    public readonly model: CmsModel;
    private fields: CmsModelField[];

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
        const apiName = `${params.apiName}SearchRecord`;
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
        const index = this.fields.findIndex(field => field.id === id);
        this.fields.splice(index, 1);
    }
}
