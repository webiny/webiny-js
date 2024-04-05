import React from "react";
import {
    ContentEntryEditorConfig as BaseContentEntryEditorConfig,
    ContentEntryListConfig
} from "./admin/config/contentEntries";

export * from "./HeadlessCMS";
export * from "./admin/hooks";
export { LexicalEditorConfig } from "~/admin/lexicalConfig/LexicalEditorConfig";
export * from "~/admin/components/ContentEntryForm/FieldElement";
export { ModelProvider } from "~/admin/components/ModelProvider";
export { ContentEntryListConfig };

interface LegacyContentEntriesViewConfigProps {
    children: React.ReactNode;
}

/**
 * DANGER!
 * The following components are created to support the old experimental API:
 * - `Filter` has been mapped to the new `ContentEntryListConfig.Browser`namespace;
 * - `Sorter` has been deprecated.
 *
 * Check out 5.37.0 changelog and discover the new `ContentEntryListConfig` API.
 */
const LegacyContentEntriesViewConfig = ({ children }: LegacyContentEntriesViewConfigProps) => {
    return <ContentEntryListConfig>{children}</ContentEntryListConfig>;
};

// eslint-disable-next-line
const LegacySorter = (props: any) => null;

/**
 * @deprecated Use ContentEntryListConfig instead.
 */
export const ContentEntriesViewConfig = Object.assign(LegacyContentEntriesViewConfig, {
    Filter: ContentEntryListConfig.Browser.Filter,
    Sorter: LegacySorter
});

import { Components as AllComponents } from "./components";

/**
 * @deprecated Use `ContentEntryEditorConfig` namespace instead.
 */
export const Components = AllComponents;

export const ContentEntryEditorConfig = Object.assign(BaseContentEntryEditorConfig, AllComponents);
