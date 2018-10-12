// @flow
import { I18n, defaultProcessor } from "webiny-i18n";
import reactProcessor from "webiny-i18n-react";

const i18n = new I18n();
i18n.registerProcessors([defaultProcessor, reactProcessor]);
export default i18n;
