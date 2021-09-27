import { ApiKeyDynamoDbFieldPlugin } from "~/plugins/ApiKeyDynamoDbFieldPlugin";

export default () => [
    new ApiKeyDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    })
];
