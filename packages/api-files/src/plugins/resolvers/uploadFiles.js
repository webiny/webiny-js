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
import getPreSignedPostPayload from "./utils/getPresignedPostPayload";
import { BATCH_UPLOAD_MAX_FILES } from "./utils/constants";
export default (root, args) => __awaiter(void 0, void 0, void 0, function* () {
    const { data: files } = args;
    if (!Array.isArray(files)) {
        return new ErrorResponse({
            code: "UPLOAD_FILES_NON_ARRAY",
            message: `"data" argument must be an array.`
        });
    }
    if (files.length === 0) {
        return new ErrorResponse({
            code: "UPLOAD_FILES_MIN_FILES",
            message: `"data" argument must contain at least one file.`
        });
    }
    if (files.length > BATCH_UPLOAD_MAX_FILES) {
        return new ErrorResponse({
            code: "UPLOAD_FILES_MAX_FILES",
            message: `"data" argument must not contain more than ${BATCH_UPLOAD_MAX_FILES} files.`
        });
    }
    const promises = [];
    for (let i = 0; i < files.length; i++) {
        const item = files[i];
        promises.push(getPreSignedPostPayload(item));
    }
    return new Response(yield Promise.all(promises));
});
