import { Client as ElasticsearchClient } from "@elastic/elasticsearch";
import WebinyError from "@webiny/error";
import get from "lodash/get";
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
            if (get(ex, "meta.body.error.type") === "resource_already_exists_exception") {
                return resolve();
            }

            const er = new WebinyError(
                "Could not create Elasticsearch indice.",
                "ELASTICSEARCH_INDEX",
                ex
            );
            reject(er);
        }
    });
};
