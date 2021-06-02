import mdbid from "mdbid";
import { utils } from "../utils";
import { ApplicationContext, CreateTargetArgs, ResolverResponse, Target } from "../types";
import { ErrorResponse, Response } from "@webiny/handler-graphql";

const createTarget = async (
    _,
    args: CreateTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<Target>> => {
    const { db, security } = context;
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
