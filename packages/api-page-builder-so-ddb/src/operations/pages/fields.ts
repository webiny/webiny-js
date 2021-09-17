import { PageDynamoDbFieldPlugin } from "~/plugins/definitions/PageDynamoDbFieldPlugin";
import { PageDateDynamoDbFieldPlugin } from "~/plugins/definitions/PageDateDynamoDbFieldPlugin";

export default () => [
    new PageDateDynamoDbFieldPlugin({
        name: "createdOn"
    }),
    new PageDateDynamoDbFieldPlugin({
        name: "savedOn"
    }),
    new PageDateDynamoDbFieldPlugin({
        name: "publishedOn"
    }),
    new PageDynamoDbFieldPlugin({
        name: "createdBy",
        path: "createdBy.id",
        sortable: false
    }),
    new PageDynamoDbFieldPlugin({
        name: "ownedBy",
        path: "ownedBy.id",
        sortable: false
    }),
    new PageDynamoDbFieldPlugin({
        name: "tags",
        path: "settings.general.tags",
        sortable: false
    })
];
