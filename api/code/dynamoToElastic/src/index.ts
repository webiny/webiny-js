import { Converter } from "aws-sdk/clients/dynamodb";
import { createHandler } from "@webiny/handler-aws";
import { Context } from "@webiny/handler/types";
import elasticSearch from "@webiny/api-plugin-elastic-search-client";

export const handler = createHandler(
    elasticSearch({ endpoint: `https://${process.env.ELASTIC_SEARCH_ENDPOINT}` }),
    {
        type: "handler",
        async handle(context: Context) {
            const [event] = context.args;
            const operations = [];

            event.Records.forEach(record => {
                const newImage = Converter.unmarshall(record.dynamodb.NewImage);
                const oldImage = Converter.unmarshall(record.dynamodb.OldImage);
                const keys = Converter.unmarshall(record.dynamodb.Keys);
                const _id = `${keys.PK}:${keys.SK}`;

                switch (record.eventName) {
                    case "INSERT":
                    case "MODIFY":
                        operations.push({ index: { _id, _index: newImage.index } }, newImage.data);
                        break;
                    case "REMOVE":
                        operations.push({ delete: { _id, _index: oldImage.index } });
                        break;
                    default:
                        break;
                }
            });

            if (!operations.length) {
                return;
            }

            try {
                await context.elasticSearch.bulk({ body: operations });
            } catch (error) {
                console.log(JSON.stringify(error, null, 2));
                throw error;
            }

            return true;
        }
    }
);
