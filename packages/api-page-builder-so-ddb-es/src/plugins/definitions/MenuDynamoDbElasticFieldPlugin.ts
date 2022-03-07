import { FieldPlugin } from "@webiny/db-dynamodb/plugins/definitions/FieldPlugin";

export class MenuDynamoDbElasticFieldPlugin extends FieldPlugin {
    public static override readonly type: string = "pageBuilder.dynamodb.es.field.menu";
}
