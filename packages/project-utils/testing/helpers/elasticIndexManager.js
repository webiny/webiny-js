module.exports.elasticIndexManager = ({ global, client: elasticsearchClient, template }) => {
    const clearEsIndices = async () => {
        await elasticsearchClient.indices.delete({
            index: "_all"
        });
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
        for (const name of templates) {
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
            await elasticsearchClient.indices.putTemplate(template);
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
