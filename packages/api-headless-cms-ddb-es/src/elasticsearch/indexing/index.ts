import richTextIndexing from "./richTextIndexing";
import longTextIndexing from "./longTextIndexing";
import defaultFieldIndexing from "./defaultFieldIndexing";
import dateTimeIndexing from "./dateTimeIndexing";
import numberIndexing from "./numberIndexing";
import objectIndexing from "./objectIndexing";
import { createJsonIndexing } from "./jsonIndexing";

export default () => [
    dateTimeIndexing(),
    richTextIndexing(),
    longTextIndexing(),
    defaultFieldIndexing(),
    numberIndexing(),
    objectIndexing(),
    createJsonIndexing()
];
