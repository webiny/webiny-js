import React, { memo } from "react";
import { plugins } from "@webiny/plugins";
import { Compose, LocaleSelector as LocaleSelectorSpec } from "@webiny/app-admin";
import { LocaleSelector } from "./admin/LocaleSelector";
import contentPermissions from "./admin/contentPermissions";

const LocaleSelectorHOC = () => {
    return function LocaleSelectorHOC() {
        return <LocaleSelector />;
    };
};

const I18NContentExtension = () => {
    plugins.register(contentPermissions);

    return <Compose component={LocaleSelectorSpec} with={LocaleSelectorHOC} />;
};

export const I18NContent: React.ComponentType = memo(I18NContentExtension);
