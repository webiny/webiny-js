import richTextIndexing from "./richTextIndexing";
import defaultFieldIndexing from "./defaultFieldIndexing";
import dateTimeIndexing from "./dateTimeIndexing";
import numberIndexing from "./numberIndexing";

export default () => [
    dateTimeIndexing(),
    richTextIndexing(),
    defaultFieldIndexing(),
    numberIndexing()
];
