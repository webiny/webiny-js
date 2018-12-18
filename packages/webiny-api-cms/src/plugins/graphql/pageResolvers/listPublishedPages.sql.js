// @flow
export default (args: Object, context: Object) => {
    const { Page, Category, Tag, Tags2Pages } = context.cms.entities;

    const {
        page = 1,
        perPage = 10,
        category = null,
        sort = null,
        tags = null,
        tagsRule = null
    } = args;

    const variables = [];

    const categorySlug = !Category.isId(category);

    const tables = [
        `${Page.storageClassId} as p`,
        // If category slug is given, we need to join the table to find the appropriate record
        category && categorySlug ? `${Category.storageClassId} as c` : null
    ].filter(Boolean);

    if (category) {
        variables.push(category);
    }

    let tagConditions = null;
    if (tags && tags.length) {
        tagConditions = tags.map((t, i) => {
            tables.push(`${Tag.storageClassId} as t${i}`);
            tables.push(`${Tags2Pages.storageClassId} as t2p${i}`);
            variables.push(t);
            return (
                `(` +
                [`t${i}.name = ?`, `t${i}.id = t2p${i}.tag`, `t2p${i}.page = p.id`].join(" AND ") +
                `)`
            );
        });
    }

    let orderBy = "";
    if (sort && Object.keys(sort).length) {
        orderBy =
            "ORDER BY " +
            Object.keys(sort)
                .map(key => `${key} ${sort[key] > 0 ? "ASC" : "DESC"}`)
                .join(", ");
    }

    const tagsOperator = tagsRule === "ALL" ? " AND " : " OR ";
    let query = [
        "SELECT SQL_CALC_FOUND_ROWS p.*",
        `FROM ${tables.join(", ")}`,
        `WHERE 1=1`,
        // If category slug is provided - join and and find by slug.
        category && categorySlug ? `AND p.category = c.id AND c.slug = ?` : "",
        // If category ID is provided, we just use the ID directly.
        category && !categorySlug ? `AND p.category = ?` : "",
        // Only get published pages.
        // `AND p.published = 1`,
        tagConditions && tagConditions.length ? `AND (${tagConditions.join(tagsOperator)})` : "",
        "GROUP BY p.id",
        orderBy,
        "LIMIT ? OFFSET ?"
    ];

    const sql = {
        query: query.join(" "),
        values: [...variables, perPage, (page - 1) * perPage]
    };

    return sql;
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
