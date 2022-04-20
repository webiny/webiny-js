import { Client } from "@elastic/elasticsearch";

const defaultPrefix = process.env.ELASTIC_SEARCH_INDEX_PREFIX;

interface DeleteAllTemplatesParams {
    client: Client;
    prefix?: string;
}
export const deleteAllTemplates = async (params: DeleteAllTemplatesParams) => {
    const { client, prefix = defaultPrefix } = params;

    const re = new RegExp(`^${prefix}`);
    const response = await client.cat.templates();
    if (!response.body) {
        return;
    }
    const templates: string[] = Object.values(response.body)
        .map(({ name }) => {
            return name;
        })
        .filter(name => {
            return name.match(re) !== null;
        });
    if (templates.length === 0) {
        return;
    }

    for (const name of templates) {
        try {
            await client.indices.deleteTemplate({
                name
            });
        } catch (ex) {
            console.log(ex.message);
            throw ex;
        }
    }
};
