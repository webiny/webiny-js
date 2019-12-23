var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/api";
import S3 from "aws-sdk/clients/s3";
const S3_BUCKET = process.env.S3_BUCKET;
export default (root, args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const { File } = context.models;
    const { id } = args;
    const file = yield File.findById(id);
    if (!file) {
        return new NotFoundResponse(id ? `File "${id}" not found!` : "File not found!");
    }
    const s3 = new S3();
    yield s3
        .deleteObject({
        Bucket: S3_BUCKET,
        Key: file.key
    })
        .promise();
    return file
        .delete()
        .then(() => new Response(true))
        .catch(e => new ErrorResponse({
        code: e.code,
        message: e.message
    }));
});
