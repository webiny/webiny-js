import React from "react";
import { ContentEntryListConfig } from "./ContentEntryListConfig";
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

export { ContentEntryEditorConfig } from "./ContentEntryEditorConfig";
