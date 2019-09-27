// @flow
import { WithFieldsError } from "@webiny/commodo";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/api";
import { InvalidFieldsError } from "@webiny/commodo-graphql";

export default async (root: any, args: Object, context: Object) => {
    const { File } = context.models;

    const model = await File.findOne({ query: { src: args.src } });
    if (!model) {
        return new NotFoundResponse();
    }

    try {
        await model.populate(args.data).save();
    } catch (e) {
        if (
            e instanceof WithFieldsError &&
            e.code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS
        ) {
            const attrError = InvalidFieldsError.from(e);
            return new ErrorResponse({
                code: attrError.code || "VALIDATION_FAILED_INVALID_FIELDS",
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
