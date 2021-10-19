import { GroupDynamoDbFieldPlugin } from "~/plugins/GroupDynamoDbFieldPlugin";

export default () => [
    new GroupDynamoDbFieldPlugin({
        field: "createdOn",
        type: "date"
    })
];
