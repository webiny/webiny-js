// @flow
import { Entity } from "webiny-entity";
import { Response, ErrorResponse } from "webiny-api/graphql/responses";

type EntityFetcher = (context: Object) => Class<Entity>;

const getDistinctPages = ({ items }) => {
    if (!Array.isArray(items)) {
        return {};
    }

    const distinctPages = {};
    for (let i = 0; i < items.length; i++) {
        let item = items[i];
        if (Array.isArray(item.children)) {
            Object.assign(distinctPages, getDistinctPages({ items: item.children }));
            continue;
        }

        if (Entity.isId(item.page)) {
            distinctPages[item.page] = null;
        }
    }

    return distinctPages;
};

const prepareItems = ({ items, distinctPages }) => {
    if (!Array.isArray(items)) {
        return [];
    }

    const output = [];
    for (let i = 0; i < items.length; i++) {
        let item = items[i];

        // If page needed to be loaded but failed, just skip.
        if (Entity.isId(item.page) && !distinctPages[item.page]) {
            continue;
        }

        output.push({
            id: item.id,
            title: item.title,
            url: item.url || distinctPages[item.page],
            children: prepareItems({ items: item.children, distinctPages })
        });
    }

    return output;
};

export default (entityFetcher: EntityFetcher) => async (
    root: any,
    args: Object,
    context: Object
) => {
    const { slug } = args;
    const entityClass = entityFetcher(context);

    const entity = await entityClass.findOne({ query: { slug } });
    if (!entity) {
        return new ErrorResponse({
            code: "NOT_FOUND",
            message: "Menu not found."
        });
    }

    let distinctPages = getDistinctPages({ items: entity.items });
    const ids = Object.keys(distinctPages);

    const sql = `SELECT id, title, url FROM Cms_Pages WHERE published = 1 AND id IN (${ids
        .map(() => "?")
        .join(",")})`;

    await Entity.getDriver()
        .getConnection()
        .query(sql, ids)
        .then(results => {
            for (let i = 0; i < results.length; i++) {
                let result = results[i];
                distinctPages[result.id] = result;
            }
        });

    return new Response({
        id: entity.id,
        title: entity.title,
        items: prepareItems({ items: entity.items, distinctPages })
    });
};
