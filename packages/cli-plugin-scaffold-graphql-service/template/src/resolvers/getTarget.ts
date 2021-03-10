import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { configuration } from "../configuration";
import { ApplicationContext, GetTargetArgs, ResolverResponse, Target } from "../types";

const getTarget = async (
    _,
    args: GetTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<Target>> => {
    const { db } = context;
    const { id } = args;

    // retrieve from the database
    const response = await db.read<Target>({
        ...configuration.db(context),
        query: {
            PK: id,
            SK: "A"
        },
        limit: 1
    });
    const [items] = response;
    const [item] = items;
    if (!item) {
        return new ErrorResponse({
            message: `Target with id "${id}" not found.`,
            code: "NOT_FOUND",
            data: {
                id
            }
        });
    }

    return new Response(item);
};

export default getTarget;
