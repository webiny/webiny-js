import { Converter } from "aws-sdk/clients/dynamodb";
import { HandlerPlugin } from "@webiny/handler/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";

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
