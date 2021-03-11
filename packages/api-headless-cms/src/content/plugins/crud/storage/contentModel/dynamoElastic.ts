import {
    CmsContentModel,
    CmsContentModelCrud,
    CmsContentModelCrudCreateArgs,
    CmsContentModelCrudDeleteArgs,
    CmsContentModelCrudGetArgs,
    CmsContentModelCrudUpdateArgs,
    CmsContext
} from "../../../../../types";
import * as utils from "../../../../../utils";
import WebinyError from "@webiny/error";

interface ConstructorArgs {
    context: CmsContext;
    basePrimaryKey: string;
}
export default class CmsContentModelCrudDynamoElastic implements CmsContentModelCrud {
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

    public async create({ data }: CmsContentModelCrudCreateArgs): Promise<CmsContentModel> {
        const { db, elasticSearch } = this.context;

        const esIndex = utils.defaults.es(this.context, data);
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
                // TODO there should be no defaults like this anymore
                ...utils.defaults.db(),
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
        await elasticSearch.indices.delete(esIndex);

        throw ex;
    }

    public async delete({ model }: CmsContentModelCrudDeleteArgs): Promise<boolean> {
        const { db, elasticSearch } = this.context;
        await db.delete({
            // TODO there should be no defaults like this anymore
            ...utils.defaults.db(),
            query: {
                PK: this.primaryKey,
                SK: model.modelId
            }
        });
        const esIndex = utils.defaults.es(this.context, model);
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
    public async get({ id }: CmsContentModelCrudGetArgs): Promise<CmsContentModel | null> {
        const { db } = this.context;

        const [[model]] = await db.read<CmsContentModel>({
            // TODO there should be no defaults like this anymore
            ...utils.defaults.db(),
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
            // TODO there should be no defaults like this anymore
            ...utils.defaults.db(),
            query: {
                PK: this.primaryKey,
                SK: {
                    $gt: " "
                }
            }
        });

        return models;
    }

    public async update({ model, data }: CmsContentModelCrudUpdateArgs): Promise<CmsContentModel> {
        const { db } = this.context;
        await db.update({
            // TODO there should be no defaults like this anymore
            ...utils.defaults.db(),
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
