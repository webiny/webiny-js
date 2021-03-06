import { Client as ElasticsearchClient } from "@elastic/elasticsearch";
import WebinyError from "@webiny/error";
import { ElasticsearchConfig } from "../../../utils";

export const createElasticsearchIndice = (
    es: ElasticsearchClient,
    esIndex: ElasticsearchConfig
) => {
    return new Promise(async (resolve: (value?: unknown) => void, reject: (ex: Error) => void) => {
        try {
            await es.indices.create({
                ...esIndex,
                body: {
                    // we are disabling indexing of rawValues property in object that is inserted into ES
                    mappings: {
                        properties: {
                            rawValues: { type: "object", enabled: false }
                        }
                    }
                }
            });
            resolve();
        } catch (ex) {
            const er = new WebinyError(
                "Could not create Elasticsearch indice.",
                "ELASTICSEARCH_INDEX",
                ex
            );
            reject(er);
        }
    });
};
