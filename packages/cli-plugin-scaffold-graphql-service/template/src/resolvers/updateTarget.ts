import { ErrorResponse, Response, NotFoundResponse } from "@webiny/handler-graphql";
import { utils } from "../utils";
import { ApplicationContext, ResolverResponse, Target, UpdateTargetArgs } from "../types";

/**
 * Keys to be filtered out of the DynamoDB record.
 */
const excludeKeys = ["PK", "SK"];

const updateTarget = async (
    _,
    args: UpdateTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<Target>> => {
    const { db } = context;
    const { id, data } = args;
    /**
     * Primary key is always constructed out of the id and a fixed Target configuration.
     */
    const primaryKey = utils.createPk(context, id);
    /**
     * First we need to check if the target we want to update is actually in the database.
     */
    const [[item]] = await db.read<Target>({
        ...utils.db(context),
        query: {
            PK: primaryKey,
            SK: id
        },
        limit: 1
    });
    if (!item) {
        return new NotFoundResponse(`Target with id "${id}" not found.`);
    }
    /**
     * If there is no data sent, we do not need to proceed to updating the target.
     * Some proper validation should be inserted instead of part.
     */
    if (Object.keys(data).length === 0) {
        return new Response(item);
    }

    /**
     * Build the Target data model to be updated in the database.
     */
    const modelData: Target = {
        ...item,
        ...data,
        savedOn: new Date().toISOString()
    };
    /**
     * Remove the keys which are not needed later on.
     */
    const model: Target = Object.keys(modelData).reduce((acc, key) => {
        if (excludeKeys.includes(key)) {
            return acc;
        }
        acc[key] = modelData[key];
        return acc;
    }, ({} as unknown) as Target);

    /**
     * We do operations in batch, when possible, so there are no multiple calls towards the DynamoDB.
     */
    const batch = db.batch();
    batch
        /**
         * Update the DynamoDB target record.
         */
        .update({
            ...utils.db(context),
            query: {
                PK: primaryKey,
                SK: id
            },
            data: {
                PK: primaryKey,
                SK: id,
                ...model,
                /**
                 * We always insert the version of Webiny this target was created with so it can be used later for upgrades.
                 */
                webinyVersion: context.WEBINY_VERSION
            }
        })

    /**
     * Try to update the data in the DynamoDB. Fail with response if error happens.
     */
    try {
        await batch.execute();
    } catch (ex) {
        return new ErrorResponse({
            message: ex.message,
            code: ex.code || "TARGET_UPDATE_ERROR",
            data: ex
        });
    }

    return new Response(model);
};

export default updateTarget;
