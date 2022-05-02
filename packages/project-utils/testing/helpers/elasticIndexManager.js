let prefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX || "";

module.exports.elasticIndexManager = ({ global, client: elasticsearchClient, template }) => {
    /**
     * Prefix MUST exist. we cannot allow going further without the prefix.
     */
    if (!prefix) {
        throw new Error("process.env.ELASTIC_SEARCH_INDEX_PREFIX is not set!");
    }
    /**
     *
     * The regex to match all the indexes or templates used by this tests.
     */
    const re = new RegExp(`^${prefix}`);
    const clearEsIndices = async () => {
        const response = await elasticsearchClient.cat.indices({
            format: "json"
        });
        if (!response.body) {
            return;
        }
        const items = Object.values(response.body)
            .map(item => {
                return item.index;
            })
            .filter(index => {
                return index.match(re) !== null;
            });
        if (items.length === 0) {
            return;
        }

        try {
            await elasticsearchClient.indices.delete({
                index: items
            });
        } catch (ex) {
            console.log(ex.message);
            //throw ex;
        }
    };

    const clearEsIndexTemplates = async () => {
        const templates = [];
        try {
            const response = await elasticsearchClient.indices.getTemplate();
            if (!response || !response.body) {
                return;
            }
            templates.push(...Object.keys(response.body));
        } catch (ex) {
            console.log(ex);
            console.log(ex.meta.body.error);
        }
        if (templates.length === 0) {
            return;
        }

        const filteredTemplates = templates.filter(tpl => {
            return tpl.match(re) !== null;
        });
        for (const name of filteredTemplates) {
            try {
                await elasticsearchClient.indices.deleteTemplate({
                    name
                });
            } catch (ex) {
                console.log(`Could not delete Elasticsearch index template "${name}".`);
            }
        }
    };

    global.__beforeEach = async () => {
        await clearEsIndices();
        if (!template) {
            throw new Error("Missing Elasticsearch Index template.");
        }
        try {
            await elasticsearchClient.indices.putTemplate({
                ...template,
                name: template.name.match(re) === null ? `${prefix}${template.name}` : template.name
            });
        } catch (ex) {
            console.log(ex);
            throw ex;
        }
    };

    global.__afterEach = async () => {
        await clearEsIndices();
        await clearEsIndexTemplates();
    };

    global.__beforeAll = async () => {
        await clearEsIndices();
        await clearEsIndexTemplates();
    };

    global.__afterAll = async () => {
        await clearEsIndices();
        await clearEsIndexTemplates();
    };
};
