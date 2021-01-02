import richTextIndexing from "./richTextIndexing";
import defaultFieldIndexPlugin from "./defaultFieldIndexPlugin";

export default () => [richTextIndexing(), defaultFieldIndexPlugin()];
