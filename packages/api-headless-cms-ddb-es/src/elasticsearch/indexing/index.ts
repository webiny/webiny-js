import richTextIndexing from "./richTextIndexing";
import defaultFieldIndexing from "./defaultFieldIndexing";
import dateTimeIndexing from "./dateTimeIndexing";
import numberIndexing from "./numberIndexing";
import objectIndexing from "./objectIndexing";

export default () => [
    dateTimeIndexing(),
    richTextIndexing(),
    defaultFieldIndexing(),
    numberIndexing(),
    objectIndexing()
];
