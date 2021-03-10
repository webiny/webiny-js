import { ErrorResponse, Response } from "@webiny/handler-graphql";
import mdbid from "mdbid";
import { configuration } from "../configuration";
import { ApplicationContext, CreateTargetArgs, ResolverResponse, Target } from "../types";

const createTarget = async (
    _,
    args: CreateTargetArgs,
    context: ApplicationContext
): Promise<ResolverResponse<Target>> => {
    const { db, security } = context;
    const { data } = args;

    const date = new Date().toISOString();

    const model: Target = {
        id: mdbid(),
        createdBy: security.getIdentity(),
        savedBy: security.getIdentity(),
        createdOn: date,
        savedOn: date,
        // custom user defined fields
        title: data.title,
        description: data.description,
        isNice: data.isNice === undefined ? false : data.isNice
    };

    const { index: esIndex } = configuration.es(context);

    const batch = db.batch();
    batch
        // create the dynamodb target item
        .create({
            ...configuration.db(context),
            data: {
                PK: model.id,
                SK: "A",
                ...model,
                webinyVersion: context.WEBINY_VERSION
            }
        })
        // create the dynamodb target item in stream table
        .create({
            ...configuration.esDb(context),
            data: {
                PK: model.id,
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
            code: ex.code || "COULD_NOT_INSERT_DATA_INTO_DYNAMODB",
            data: ex
        });
    }

    return new Response(model);
};

export default createTarget;
