module.exports.elasticIndexManager = ({ global, client: elasticsearchClient, template = null }) => {
    const clearEsIndices = async () => {
        await elasticsearchClient.indices.delete({
            index: "_all"
        });
    };

    const clearEsIndexTemplates = async () => {
        const templates = [];
        try {
            const response = await elasticsearchClient.indices.getIndexTemplate();
            if (
                !response ||
                !response.body ||
                Array.isArray(response.body.index_templates) === false
            ) {
                return;
            }
            for (const tpl of response.body.index_templates) {
                if (!tpl.name) {
                    continue;
                }
                templates.push(tpl.name);
            }
        } catch (ex) {
            console.log(ex);
            console.log(ex.meta.body.error);
        }
        if (templates.length === 0) {
            return;
        }
        for (const name of templates) {
            try {
                await elasticsearchClient.indices.deleteIndexTemplate({
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
            return;
        }
        try {
            await elasticsearchClient.indices.putIndexTemplate(template);
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
