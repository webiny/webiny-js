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

interface ConstructorArgs {
    context: CmsContext;
    basePrimaryKey: string;
}
export default class CmsContentModelCrudDynamoElastic implements CmsContentModelStorageOperations {
    private readonly _context: CmsContext;
    private readonly _primaryKey: string;

    private get context(): CmsContext {
        return this._context;
    }

    private get primaryKey(): string {
        return this._primaryKey;
    }
    public constructor({ context, basePrimaryKey }: ConstructorArgs) {
        this._context = context;
        this._primaryKey = `${basePrimaryKey}#CM`;
    }

    public async create({
        data
    }: CmsContentModelStorageOperationsCreateArgs): Promise<CmsContentModel> {
        const { db, elasticSearch } = this.context;

        const esIndex = configurations.es(this.context, data);
        try {
            const { body: exists } = await elasticSearch.indices.exists(esIndex);
            if (!exists) {
                await elasticSearch.indices.create(esIndex);
            }
        } catch (ex) {
            throw new WebinyError(
                "Could not create Elasticsearch indice.",
                "ELASTICSEARCH_INDICE_CREATE_ERROR",
                {
                    error: ex,
                    esIndex
                }
            );
        }
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
            ex = e;
        }
        try {
            await elasticSearch.indices.delete(esIndex);
        } catch {}

        throw ex;
    }

    public async delete({ model }: CmsContentModelStorageOperationsDeleteArgs): Promise<boolean> {
        const { db, elasticSearch } = this.context;
        await db.delete({
            ...configurations.db(),
            query: {
                PK: this.primaryKey,
                SK: model.modelId
            }
        });
        const esIndex = configurations.es(this.context, model);
        try {
            await elasticSearch.indices.delete(esIndex);
        } catch (ex) {
            throw new WebinyError(
                "Could not delete Elasticsearch indice.",
                "ELASTICSEARCH_INDICE_DELETE_ERROR",
                {
                    error: ex,
                    esIndex
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
