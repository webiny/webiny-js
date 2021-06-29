import richTextIndexing from "./richTextIndexing";
import defaultFieldIndexing from "./defaultFieldIndexing";
import dateTimeIndexing from "./dateTimeIndexing";
import numberIndexing from "./numberIndexing";
import longTextIndexing from "./longTextIndexing";

export default () => [
    dateTimeIndexing(),
    richTextIndexing(),
    defaultFieldIndexing(),
    numberIndexing(),
    longTextIndexing()
];
