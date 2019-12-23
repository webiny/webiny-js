var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ListResponse } from "@webiny/api";
export default (root, args, context) => __awaiter(void 0, void 0, void 0, function* () {
    const { File } = context.models;
    const { page = 1, perPage = 10, sort = null, search = "", types = [], tags = [], ids = [] } = args;
    const findArgs = { query: null, page, perPage, sort };
    const $and = [];
    $and.push({ "meta.private": { $ne: true } }); // Files created by the system, eg. installation files.
    if (Array.isArray(types) && types.length) {
        $and.push({ type: { $in: types } });
    }
    if (search) {
        $and.push({
            $or: [
                { name: { $regex: `.*${search}.*`, $options: "i" } },
                { tags: { $in: search.split(" ") } }
            ]
        });
    }
    if (Array.isArray(tags) && tags.length > 0) {
        $and.push({
            tags: { $in: tags.map(tag => tag.toLowerCase()) }
        });
    }
    if (Array.isArray(ids) && ids.length > 0) {
        $and.push({
            id: { $in: ids }
        });
    }
    if ($and.length) {
        findArgs.query = { $and };
    }
    const data = yield File.find(findArgs);
    return new ListResponse(data, data.getMeta());
});
