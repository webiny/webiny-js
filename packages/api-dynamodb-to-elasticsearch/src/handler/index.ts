import { Converter } from "aws-sdk/clients/dynamodb";
import { HandlerPlugin } from "@webiny/handler/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";
import WebinyError from "@webiny/error";

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
        }
        throw new WebinyError(err, "DYNAMODB_TO_ELASTICSEARCH_ERROR", item);
    }
};

export default (): HandlerPlugin<ElasticsearchContext> => ({
    type: "handler",
    async handle(context) {
        const [event] = context.args;
        const operations = [];

        event.Records.forEach(record => {
            const newImage = Converter.unmarshall(record.dynamodb.NewImage);

            if (newImage.ignore === true) {
                return;
            }

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
