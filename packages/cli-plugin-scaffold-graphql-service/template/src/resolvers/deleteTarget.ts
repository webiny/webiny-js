import { ErrorResponse, Response, NotFoundResponse } from "@webiny/handler-graphql";
import { utils } from "../utils";
import { ApplicationContext, DeleteTargetArgs, ResolverResponse, Target } from "../types";

const deleteTarget = async (
    _,
    args: DeleteTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<boolean>> => {
    const { db } = context;
    const { id } = args;
    /**
     * Primary key is always constructed out of the id and a fixed Target configuration.
     */
    const primaryKey = utils.createPk(context, id);
    /**
     * First we need to check if the target we want to delete is actually in the database.
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
     * We do operations in batch, when possible, so there are no multiple calls towards the DynamoDB.
     */
    const batch = db.batch();
    batch.delete(
        /**
         * Delete the DynamoDB target record.
         */
        {
            ...utils.db(context),
            query: {
                PK: primaryKey,
                SK: id
            }
        },

    );
    /**
     * Try to delete the data from the DynamoDB. Fail with response if error happens.
     */
    try {
        await batch.execute();
    } catch (ex) {
        return new ErrorResponse({
            message: ex.message,
            code: ex.code || "TARGET_DELETE_ERROR",
            data: ex
        });
    }

    return new Response(true);
};

export default deleteTarget;
