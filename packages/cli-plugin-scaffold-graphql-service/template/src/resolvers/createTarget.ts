import mdbid from "mdbid";
import { utils } from "../utils";
import { ApplicationContext, CreateTargetArgs, ResolverResponse, Target } from "../types";
import { ErrorResponse, Response } from "@webiny/handler-graphql";

const createTarget = async (
    _,
    args: CreateTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<Target>> => {
    const { db, security, elasticsearch } = context;
    const { data } = args;

    /**
     * Build the Target data model to be inserted into the database.
     */
    const model: Target = {
        id: mdbid(),
        createdBy: security.getIdentity(),
        savedBy: security.getIdentity(),
        /**
         * We need to transform the Date object to iso string since DynamoDB insert will not do it automatically.
         */
        createdOn: new Date().toISOString(),
        savedOn: new Date().toISOString(),
        /**
         * Custom user defined fields.
         */
        title: data.title,
        description: data.description,
        isNice: data.isNice === undefined ? false : data.isNice
    };
    /**
     * Create, and check for existence, index name that is going to be used when streaming from DDB to Elasticsearch.
     * Can be removed if Elasticsearch is not used.
     */
    const esConfig = utils.es(context);
    try {
        const { body: hasIndice } = await elasticsearch.indices.exists(esConfig);
        if (!hasIndice) {
            return new ErrorResponse({
                message: "You must run the install mutation to create the Elasticsearch index.",
                code: "ELASTICSEARCH_ERROR",
                data: esConfig
            });
        }
    } catch (ex) {
        return new ErrorResponse({
            message: ex.message || "Error while checking for Elasticsearch index existence.",
            code: ex.code || "ELASTICSEARCH_ERROR",
            data: ex.data
        });
    }
    const { index: esIndex } = esConfig;

    /**
     * Primary key is always constructed out of the target.id and a fixed Target configuration.
     */
    const primaryKey = utils.createPk(context, model.id);
    /**
     * We do operations in batch, when possible, so there are no multiple calls towards the DynamoDB.
     */
    const batch = db.batch();
    batch
        /**
         * Create the DynamoDB target record.
         */
        .create({
            ...utils.db(context),
            data: {
                PK: primaryKey,
                /**
                 * Need something as SecondaryKey so we put the id of the Target.
                 * Can be createdOn so you can sort and search by it (if there is no Elasticsearch).
                 */
                SK: model.id,
                ...model,
                /**
                 * We always insert the version of Webiny this target was created with so it can be used later for upgrades.
                 */
                webinyVersion: context.WEBINY_VERSION
            }
        })
        /**
         * Create the DynamoDB target record in stream table.
         * Can be removed if Elasticsearch is not used.
         */
        .create({
            ...utils.esDb(context),
            data: {
                PK: primaryKey,
                SK: model.id,
                /**
                 * Elasticsearch index that is this table streaming to.
                 */
                index: esIndex,
                data: {
                    ...model,
                    webinyVersion: context.WEBINY_VERSION
                }
            }
        });
    /**
     * Try to insert the data into the DynamoDB. Fail with response if error happens.
     */
    try {
        await batch.execute();
    } catch (ex) {
        return new ErrorResponse({
            message: ex.message,
            code: ex.code || "TARGET_INSERT_ERROR",
            data: ex
        });
    }

    return new Response(model);
};

export default createTarget;
