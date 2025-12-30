export type FeatureFlags<TFeatureFlags = Record<string, any>> = {
    allowCmsLegacyRichTextInput?: boolean;
    cmsLegacyEntryEditor?: boolean;
    experimentalDynamicPages?: boolean;
    newWatchCommand?: boolean;
} & TFeatureFlags;

let featureFlags: FeatureFlags = {};

// In API applications.
if (process.env.WBY_FEATURE_FLAGS) {
    featureFlags = JSON.parse(process.env.WBY_FEATURE_FLAGS) as FeatureFlags;

    // In React applications.
} else if (process.env.REACT_APP_WBY_FEATURE_FLAGS) {
    featureFlags = JSON.parse(process.env.REACT_APP_WBY_FEATURE_FLAGS) as FeatureFlags;
}

export { featureFlags };
