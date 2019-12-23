var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Response, ErrorResponse } from "@webiny/api";
import { BATCH_CREATE_MAX_FILES } from "./utils/constants";
export default (root, args, context) => __awaiter(void 0, void 0, void 0, function* () {
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
        let file = yield File.findById(item.id);
        if (!file) {
            file = new File();
        }
        yield file.populate(item).save();
        data.push(file);
    }
    return new Response(data);
});
