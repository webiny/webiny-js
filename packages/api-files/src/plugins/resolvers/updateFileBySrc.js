// @flow
import { ModelError } from "@webiny/model";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/api/graphql/responses";
import { InvalidAttributesError } from "@webiny/api/graphql";

export default (modelFetcher: Function) => async (root: any, args: Object, context: Object) => {
    const modelClass = modelFetcher(context);
    const model = await modelClass.findOne({ query: { src: args.src } });
    if (!model) {
        return new NotFoundResponse();
    }

    try {
        await model.populate(args.data).save();
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
    return new Response(model);
};
