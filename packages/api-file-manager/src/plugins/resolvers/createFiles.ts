import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { BATCH_CREATE_MAX_FILES } from "./utils/constants";
import { FileManagerResolverContext } from "../../types";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    const { data: filesData } = args;
    if (!Array.isArray(filesData)) {
        return new ErrorResponse({
            code: "CREATE_FILES_NON_ARRAY",
            message: `"data" argument must be an array.`
        });
    }

    if (filesData.length === 0) {
        return new ErrorResponse({
            code: "CREATE_FILES_MIN_FILES",
            message: `"data" argument must contain at least one file.`
        });
    }

    if (filesData.length > BATCH_CREATE_MAX_FILES) {
        return new ErrorResponse({
            code: "CREATE_FILES_MAX_FILES",
            message: `"data" argument must not contain more than ${BATCH_CREATE_MAX_FILES} files.`
        });
    }

    try {
        const data = await context.fileManager.files.createFilesInBatch(filesData);

        return new Response(data);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
