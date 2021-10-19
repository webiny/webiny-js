import { UserDynamoDbFieldPlugin } from "~/plugins/UserDynamoDbFieldPlugin";

export default () => [
    new UserDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    })
];
