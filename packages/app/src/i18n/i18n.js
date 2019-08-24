// @flow
import i18n, { defaultProcessor, defaultModifiers } from "@webiny/i18n";
import reactProcessor from "@webiny/i18n-react";

i18n.registerProcessors([defaultProcessor, reactProcessor]);
i18n.registerModifiers(defaultModifiers);

export default i18n;
