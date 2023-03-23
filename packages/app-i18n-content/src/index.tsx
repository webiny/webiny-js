import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { Compose, LocaleSelector as LocaleSelectorSpec } from "@webiny/app-admin";
import { LocaleSelector } from "./admin/LocaleSelector";
import contentPermissions from "./admin/contentPermissions";

const LocaleSelectorHOC = (): React.VFC => {
    return function LocaleSelectorHOC() {
        return <LocaleSelector />;
    };
};

const I18NContentExtension: React.VFC = () => {
    plugins.register(contentPermissions);

    return <Compose component={LocaleSelectorSpec} with={LocaleSelectorHOC} />;
};

export const I18NContent: React.VFC = memo(I18NContentExtension);
