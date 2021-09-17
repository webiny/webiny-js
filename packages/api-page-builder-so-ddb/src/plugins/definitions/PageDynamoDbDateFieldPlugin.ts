import { PageDynamoDbFieldPlugin } from "./PageDynamoDbFieldPlugin";

export class PageDynamoDbDateFieldPlugin extends PageDynamoDbFieldPlugin {
    transformValue(value: any): Date {
        if (value instanceof Date) {
            return value;
        }
        return new Date(value);
    }
}
