import i18n from "webiny-i18n";
import defaultProcessor from "webiny-i18n/src/processors/default";
import reactProcessor from "webiny-i18n-react";

i18n.registerProcessors([defaultProcessor, reactProcessor]);
export default i18n;
