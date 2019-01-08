// @flow
export default (args: Object, context: Object) => {
    const { Page, Category, Tag, Tags2Pages } = context.cms.entities;

    const {
        page = 1,
        perPage = 10,
        category = null,
        parent = null,
        id = null,
        url = null,
        sort = null,
        tags = null,
        tagsRule = null
    } = args;

    const categorySlug = !Category.isId(category);

    // 1. Tables
    const tables = [
        `${Page.storageClassId} as p`,
        // If category slug is given, we need to join the table to find the appropriate record
        category && categorySlug ? `${Category.storageClassId} as c` : null
    ].filter(Boolean);

    // 2. "ORDER BY"
    let orderBy = "";
    if (sort && Object.keys(sort).length) {
        orderBy =
            "ORDER BY " +
            Object.keys(sort)
                .map(key => `${key} ${sort[key] > 0 ? "ASC" : "DESC"}`)
                .join(", ");
    }

    // 3. "WHERE"
    const tagsOperator = tagsRule === "ALL" ? " AND " : " OR ";

    const where = ["p.published = 1"];
    const variables = [];

    if (parent) {
        if (Array.isArray(parent)) {
            where.push(`AND p.parent IN (${parent.map(() => "?").join(",")})`);
            variables.push(...parent);
        } else {
            where.push(`AND p.parent = ?`);
            variables.push(parent);
        }
    }

    if (id) {
        if (Array.isArray(id)) {
            where.push(`AND p.id IN (${id.map(() => "?").join(",")})`);
            variables.push(...id);
        } else {
            where.push(`AND p.id = ?`);
            variables.push(id);
        }
    }

    if (url) {
        if (Array.isArray(url)) {
            where.push(`AND p.url IN (${url.map(() => "?").join(",")})`);
            variables.push(...url);
        } else {
            where.push(`AND p.url = ?`);
            variables.push(url);
        }
    }

    if (category) {
        variables.push(category);
        // If category slug is provided - join and and find by slug.
        if (categorySlug) {
            where.push(`AND p.category = c.id AND c.slug = ?`);
        } else {
            // If category ID is provided, we just use the ID directly.
            where.push(`AND p.category = ?`);
        }
    }

    if (tags && tags.length) {
        const tagConditions = tags.map((t, i) => {
            tables.push(`${Tag.storageClassId} as t${i}`);
            tables.push(`${Tags2Pages.storageClassId} as t2p${i}`);
            variables.push(t);
            return (
                `(` +
                [`t${i}.name = ?`, `t${i}.id = t2p${i}.tag`, `t2p${i}.page = p.id`].join(" AND ") +
                `)`
            );
        });

        if (tagConditions.length > 0) {
            where.push(`AND (${tagConditions.join(tagsOperator)})`);
        }
    }

    let query = [
        "SELECT SQL_CALC_FOUND_ROWS p.*",
        `FROM ${tables.join(", ")}`,
        `WHERE`,
        ...where,
        "GROUP BY p.id",
        orderBy,
        "LIMIT ? OFFSET ?"
    ];

    return {
        query: query.join(" "),
        values: [...variables, perPage, (page - 1) * perPage]
    };
};

/* EXAMPLE OF A FINAL QUERY
=====================================================
SELECT SQL_CALC_FOUND_ROWS p.*
FROM Cms_Pages as p,
Cms_Tags as t1, Cms_Tags2Pages as t2p1,
Cms_Tags as t2, Cms_Tags2Pages as t2p2,
Cms_Categories as c
WHERE 1=1
AND p.category = c.id AND c.slug = "blog"
AND (t1.name = "nodejs" AND t1.id = t2p1.tag AND t2p1.page = p.id)
AND (t2.name = "serverless" AND t2.id = t2p2.tag AND t2p2.page = p.id)
GROUP BY p.id ORDER BY title ASC LIMIT 10 OFFSET 0
*/
