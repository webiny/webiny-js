export default (args: Object, context: Object) => {
    const { Page, Category, Tag, Tags2Pages } = context.cms;

    const {
        page = 1,
        perPage = 10,
        category = null,
        sort = null,
        tags = null,
        tagsRule = null
    } = args;

    const variables = [];

    const tables = [
        `${Page.storageClassId} as p`,
        category ? `${Category.storageClassId} as c` : null
    ].filter(Boolean);

    if (category) {
        variables.push(category);
    }

    let tagConditions = null;
    if (tags) {
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
    if (sort) {
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
        category ? `AND p.category = c.id AND c.slug = ?` : "",
        `AND p.published = 1`,
        tagConditions ? `AND (${tagConditions.join(tagsOperator)})` : "",
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
