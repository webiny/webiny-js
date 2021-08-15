import { Converter } from "aws-sdk/clients/dynamodb";
import { HandlerPlugin } from "@webiny/handler/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import WebinyError from "@webiny/error";
import { decompress } from "@webiny/api-elasticsearch/compression";

enum Operations {
    INSERT = "INSERT",
    MODIFY = "MODIFY",
    REMOVE = "REMOVE"
}

const getError = (item: any): string | null => {
    if (!item.index || !item.index.error || !item.index.error.reason) {
        return null;
    }
    const reason = item.index.error.reason;
    if (reason.match(/no such index \[([a-zA-Z0-9_-]+)\]/) !== null) {
        return "index";
    }
    return reason;
};
const checkErrors = (result: any) => {
    if (!result || !result.body || !result.body.items) {
        return;
    }
    for (const item of result.body.items) {
        const err = getError(item);
        if (!err) {
            continue;
        } else if (err === "index") {
            if (process.env.DEBUG === "true") {
                console.log("Bulk response", JSON.stringify(result, null, 2));
            }
            continue;
        }
        throw new WebinyError(err, "DYNAMODB_TO_ELASTICSEARCH_ERROR", item);
    }
};

export default (): HandlerPlugin<ElasticsearchContext> => ({
    type: "handler",
    async handle(context) {
        const [event] = context.args;
        const operations = [];

        for (const record of event.Records) {
            const newImage = Converter.unmarshall(record.dynamodb.NewImage);

            if (newImage.ignore === true) {
                continue;
            }

            const oldImage = Converter.unmarshall(record.dynamodb.OldImage);
            const keys = Converter.unmarshall(record.dynamodb.Keys);
            const _id = `${keys.PK}:${keys.SK}`;
            const operation = record.eventName;

            /**
             * On operations other than REMOVE we decompress the data and store it into the Elasticsearch.
             * No need to try to decompress if operation is REMOVE since there is no data sent into that operation.
             */
            let data: any = undefined;
            if (operation !== Operations.REMOVE) {
                /**
                 * We must decompress the data that is going into the Elasticsearch.
                 */
                data = await decompress(context, newImage.data);
                /**
                 * No point in writing null or undefined data into the Elasticsearch.
                 * This might happen on some error while decompressing. We will log it.
                 *
                 * Data should NEVER be null or undefined in the Elasticsearch DynamoDB table, unless it is a delete operations.
                 * If it is - it is a bug.
                 */
                if (data === undefined || data === null) {
                    console.log(
                        `Could not get decompressed data, skipping ES operation "${operation}", ID ${_id}`
                    );
                    continue;
                }
            }

            switch (record.eventName) {
                case Operations.INSERT:
                case Operations.MODIFY:
                    operations.push({ index: { _id, _index: newImage.index } }, data);
                    break;
                case Operations.REMOVE:
                    operations.push({ delete: { _id, _index: oldImage.index } });
                    break;
                default:
                    break;
            }
        }

        if (!operations.length) {
            return;
        }

        try {
            const res = await context.elasticsearch.bulk({ body: operations });
            checkErrors(res);
            if (process.env.DEBUG === "true") {
                console.log("Bulk response", JSON.stringify(res, null, 2));
            }
        } catch (error) {
            if (process.env.DEBUG === "true") {
                console.log("Bulk error", JSON.stringify(error, null, 2));
            }
            throw error;
        }

        return true;
    }
});
