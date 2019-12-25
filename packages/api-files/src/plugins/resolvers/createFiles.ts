import { Response, ErrorResponse } from "@webiny/api";
import { BATCH_CREATE_MAX_FILES } from "./utils/constants";

export default async (root: any, args: {[key: string]: any}, context) => {
    const { data: files } = args;
    if (!Array.isArray(files)) {
        return new ErrorResponse({
            code: "CREATE_FILES_NON_ARRAY",
            message: `"data" argument must be an array.`
        });
    }

    if (files.length === 0) {
        return new ErrorResponse({
            code: "CREATE_FILES_MIN_FILES",
            message: `"data" argument must contain at least one file.`
        });
    }

    if (files.length > BATCH_CREATE_MAX_FILES) {
        return new ErrorResponse({
            code: "CREATE_FILES_MAX_FILES",
            message: `"data" argument must not contain more than ${BATCH_CREATE_MAX_FILES} files.`
        });
    }

    const { File } = context.models;

    const data = [];
    for (let i = 0; i < files.length; i++) {
        const item = files[i];
        let file = await File.findById(item.id);
        if (!file) {
            file = new File();
        }

        await file.populate(item).save();
        data.push(file);
    }

    return new Response(data);
};
