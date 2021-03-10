import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { configuration } from "../configuration";
import { ApplicationContext, ResolverResponse, Target, UpdateTargetArgs } from "../types";

const updateTarget = async (
    _,
    args: UpdateTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<Target>> => {
    const { db } = context;
    const { id, data } = args;

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
    if (Object.keys(data).length === 0) {
        return new Response(item);
    }

    const modelData: Target = {
        ...item,
        ...data,
        savedOn: new Date().toISOString()
    };
    const excludeKeys = ["PK", "SK"];
    const model: Target = Object.keys(modelData).reduce((acc, key) => {
        if (excludeKeys.includes(key)) {
            return acc;
        }
        acc[key] = modelData[key];
        return acc;
    }, ({} as unknown) as Target);

    const { index: esIndex } = configuration.es(context);

    const batch = db.batch();
    batch
        // dynamodb target update
        .update({
            ...configuration.db(context),
            query: {
                PK: id,
                SK: "A"
            },
            data: {
                PK: id,
                SK: "A",
                ...model,
                webinyVersion: context.WEBINY_VERSION
            }
        })
        .update({
            ...configuration.esDb(context),
            query: {
                PK: id,
                SK: "A"
            },
            data: {
                PK: id,
                SK: "A",
                index: esIndex,
                data: {
                    ...model,
                    webinyVersion: context.WEBINY_VERSION
                }
            }
        });

    try {
        await batch.execute();
    } catch (ex) {
        return new ErrorResponse({
            message: ex.message,
            code: ex.code || "COULD_NOT_UPDATE_DATA_IN_DYNAMODB",
            data: ex
        });
    }

    return new Response(model);
};

export default updateTarget;
