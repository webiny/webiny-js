import React from "react";

export * from "./HeadlessCMS";
export * from "./admin/hooks";
export { LexicalEditorConfig } from "~/admin/lexicalConfig/LexicalEditorConfig";
export { RenderFieldElement } from "~/admin/components/ContentEntryForm/RenderFieldElement";
export { ModelProvider } from "~/admin/components/ModelProvider";
import { ContentEntryEditorConfig, ContentEntryListConfig } from "./admin/config/contentEntries";
export { ContentEntryEditorConfig, ContentEntryListConfig };

/**
 * DANGER!
 * The following components are created to support the old experimental API:
 * - `Filter` has been mapped to the new `ContentEntryListConfig.Browser`namespace;
 * - `Sorter` has been deprecated.
 *
 * Check out 5.37.0 changelog and discover the new `ContentEntryListConfig` API.
 */
const LegacyContentEntriesViewConfig: React.FC = ({ children }) => {
    return <ContentEntryListConfig>{children}</ContentEntryListConfig>;
};

// eslint-disable-next-line
const LegacySorter = (props: any) => null;

/**
 * @deprecated Use ContentEntryListConfig instead
 */
export const ContentEntriesViewConfig = Object.assign(LegacyContentEntriesViewConfig, {
    Filter: ContentEntryListConfig.Browser.Filter,
    Sorter: LegacySorter
});
