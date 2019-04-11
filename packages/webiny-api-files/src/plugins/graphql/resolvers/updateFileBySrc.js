// @flow
import { ModelError } from "webiny-model";
import { ErrorResponse, Response, NotFoundResponse } from "webiny-api/graphql/responses";
import { InvalidAttributesError } from "webiny-api/graphql";

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const entityClass = entityFetcher(context);
    const entity = await entityClass.findOne({ query: { src: args.src } });
    if (!entity) {
        return new NotFoundResponse();
    }

    try {
        await entity.populate(args.data).save();
    } catch (e) {
        if (e instanceof ModelError && e.code === ModelError.INVALID_ATTRIBUTES) {
            const attrError = InvalidAttributesError.from(e);
            return new ErrorResponse({
                code: attrError.code || "INVALID_ATTRIBUTES",
                message: attrError.message,
                data: attrError.data
            });
        }
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
    return new Response(entity);
};
