// @flow
import get from "lodash.get";

export default async ({ args, context }) => {
    const { Form } = context.models;
    const { driver } = context.commodo;
    const collection = driver.getDatabase().collection(driver.getCollectionName(Form));

    const {
        page = 1,
        search,
        perPage = 10,
        parent = null,
        id = null,
        slug = null,
        version = null,
        sort = null
    } = args;

    const baseFilters = [{ published: true, deleted: false }];

    if (version) {
        baseFilters.push({ version });
    }

    if (parent) {
        if (Array.isArray(parent)) {
            baseFilters.push({ parent: { $in: parent } });
        } else {
            baseFilters.push({ parent });
        }
    }

    if (id) {
        if (Array.isArray(id)) {
            baseFilters.push({ id: { $in: id } });
        } else {
            baseFilters.push({ id });
        }
    }

    if (slug) {
        if (Array.isArray(slug)) {
            baseFilters.push({ slug: { $in: slug } });
        } else {
            baseFilters.push({ slug });
        }
    }

    if (search) {
        baseFilters.push({ title: { $regex: `.*${search}.*`, $options: "i" } });
    }

    const pipeline = [{ $match: { $and: baseFilters } }];
    if (sort) {
        pipeline.push({
            $sort: sort
        });
    }

    const pipelines = {
        results: pipeline.concat(
            { $skip: (page - 1) * perPage },
            { $limit: perPage },
            { $project: { id: 1 } }
        ),
        totalCount: pipeline.concat({
            $count: "count"
        })
    };

    const ids = await collection.aggregate(pipelines.results).toArray();
    const [totalCount] = await collection.aggregate(pipelines.totalCount).toArray();

    return {
        forms: await Form.find({ sort, query: { id: { $in: ids.map(item => item.id) } } }),
        totalCount: get(totalCount, "totalCount", 0)
    };
};
