// @flow
import { ListResponse } from "webiny-api/graphql/responses";

export default modelFetcher => async (root: any, args: Object, context: Object) => {
    const model = modelFetcher(context);
    const { page = 1, perPage = 10, sort = null, search = "", types = [], tags = [] } = args;
    const findArgs = { page, perPage, sort };

    const $and = [];
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

    if ($and.length) {
        findArgs.query = { $and };
    }

    const data = await model.find(findArgs);
    return new ListResponse(data, data.getMeta());
};
