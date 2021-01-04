import richTextIndexing from "./richTextIndexing";
import defaultFieldIndexPlugin from "./defaultFieldIndexPlugin";
import dateTimeIndexing from "./dateTimeIndexing";

export default () => [dateTimeIndexing(), richTextIndexing(), defaultFieldIndexPlugin()];
