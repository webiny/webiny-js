import { Response, NotFoundResponse } from "@webiny/handler-graphql";
import { utils } from "../utils";
import { ApplicationContext, GetTargetArgs, ResolverResponse, Target } from "../types";

const getTarget = async (
    _,
    args: GetTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<Target>> => {
    const { db } = context;
    const { id } = args;
    /**
     * Primary key is always constructed out of the id and a fixed Target configuration.
     */
    const primaryKey = utils.createPk(context, id);
    /**
     * Fetch the Target record from the DynamoDB.
     * Response is a tuple of records (always an array) and plain object containing some query and response information.
     */
    const response = await db.read<Target>({
        ...utils.db(context),
        query: {
            PK: primaryKey,
            SK: id
        },
        limit: 1
    });
    const [items] = response;
    const [item] = items;
    /**
     * Fail with NotFoundResponse if no item.
     */
    if (!item) {
        return new NotFoundResponse(`Target with id "${id}" not found.`);
    }

    return new Response(item);
};

export default getTarget;
