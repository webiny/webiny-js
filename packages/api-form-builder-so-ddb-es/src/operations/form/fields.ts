import { FormDynamoDbFieldPlugin } from "~/plugins/FormDynamoDbFieldPlugin";

export default () => [
    new FormDynamoDbFieldPlugin({
        field: "publishedOn",
        type: "date"
    })
];
