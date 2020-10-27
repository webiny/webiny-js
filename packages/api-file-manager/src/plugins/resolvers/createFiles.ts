import { Response, ErrorResponse } from "@webiny/graphql";
import { GraphQLFieldResolver } from "@webiny/graphql/types";
import { BATCH_CREATE_MAX_FILES } from "./utils/constants";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
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

    const data = [];
    for (let i = 0; i < filesData.length; i++) {
        const item = filesData[i];
        let file = await context.files.get(item.id);
        if (!file) {
            file = {};
        }
        // Set fileData
        const itemKeys = Object.keys(item);
        itemKeys.forEach(key => {
            file[key] = item[key];
        });

        await context.files.create(file);
        data.push(file);
    }

    return new Response(data);
};

export default resolver;
