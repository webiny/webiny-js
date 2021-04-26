import {
    CmsContentModel,
    CmsContentModelStorageOperations,
    CmsContentModelStorageOperationsCreateArgs,
    CmsContentModelStorageOperationsDeleteArgs,
    CmsContentModelStorageOperationsGetArgs,
    CmsContentModelStorageOperationsUpdateArgs,
    CmsContext
} from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";
import configurations from "../../configurations";
import { createBasePrimaryKey } from "../../utils";

interface ConstructorArgs {
    context: CmsContext;
}
export default class CmsContentModelDynamo implements CmsContentModelStorageOperations {
    private readonly _context: CmsContext;
    private _primaryKey: string;

    private get context(): CmsContext {
        return this._context;
    }

    private get primaryKey(): string {
        if (!this._primaryKey) {
            this._primaryKey = `${createBasePrimaryKey(this.context)}#CM`;
        }
        return this._primaryKey;
    }
    public constructor({ context }: ConstructorArgs) {
        this._context = context;
    }

    public async create({
        data
    }: CmsContentModelStorageOperationsCreateArgs): Promise<CmsContentModel> {
        const { db } = this.context;
        
        let ex;
        try {
            await db.create({
                ...configurations.db(),
                data: {
                    PK: this.primaryKey,
                    SK: data.modelId,
                    TYPE: "cms.model",
                    webinyVersion: this.context.WEBINY_VERSION,
                    ...data
                }
            });
            return data;
        } catch (e) {
            throw new WebinyError(
                ex.message || `Could not create content model`,
                ex.code || "CREATE_CONTENT_MODEL_ERROR",
                {
                    data,
                }
            );
        }
    }

    public async delete({ model }: CmsContentModelStorageOperationsDeleteArgs): Promise<boolean> {
        const { db } = this.context;
        
        try {
            await db.delete({
                ...configurations.db(),
                query: {
                    PK: this.primaryKey,
                    SK: model.modelId
                }
            });
        } catch (ex) {
            throw new WebinyError(
                "Could not delete content model.",
                "DELETE_CONTENT_MODEL_ERROR",
                {
                    model,
                }
            );
        }
        return true;
    }
    public async get({
        id
    }: CmsContentModelStorageOperationsGetArgs): Promise<CmsContentModel | null> {
        const { db } = this.context;

        const [[model]] = await db.read<CmsContentModel>({
            ...configurations.db(),
            query: {
                PK: this.primaryKey,
                SK: id
            }
        });

        return model || null;
    }
    public async list(): Promise<CmsContentModel[]> {
        const { db } = this.context;
        const [models] = await db.read<CmsContentModel>({
            ...configurations.db(),
            query: {
                PK: this.primaryKey,
                SK: {
                    $gt: " "
                }
            }
        });

        return models;
    }

    public async update({
        model,
        data
    }: CmsContentModelStorageOperationsUpdateArgs): Promise<CmsContentModel> {
        const { db } = this.context;
        await db.update({
            ...configurations.db(),
            query: {
                PK: this.primaryKey,
                SK: model.modelId
            },
            data: {
                ...data,
                webinyVersion: this.context.WEBINY_VERSION
            }
        });

        return {
            ...model,
            ...data
        };
    }
}
