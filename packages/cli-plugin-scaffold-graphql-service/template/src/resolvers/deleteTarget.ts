import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { configuration } from "../configuration";
import { ApplicationContext, DeleteTargetArgs, ResolverResponse, Target } from "../types";

const deleteTarget = async (
    _,
    args: DeleteTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<boolean>> => {
    const { db } = context;
    const { id } = args;

    const [[item]] = await db.read<Target>({
        ...configuration.db(context),
        query: {
            PK: id,
            SK: "A"
        },
        limit: 1
    });
    if (!item) {
        return new ErrorResponse({
            message: `Target with id "${id}" not found.`,
            code: "NOT_FOUND",
            data: {
                id
            }
        });
    }
    const batch = db.batch();
    batch.delete(
        {
            ...configuration.db(context),
            query: {
                PK: id,
                SK: "A"
            }
        },
        {
            ...configuration.esDb(context),
            query: {
                PK: id,
                SK: "A"
            }
        }
    );

    try {
        await batch.execute();
    } catch (ex) {
        return new ErrorResponse({
            message: ex.message,
            code: ex.code || "COULD_NOT_DELETE_DATA_FROM_DYNAMODB",
            data: ex
        });
    }

    return new Response(true);
};

export default deleteTarget;
