export type FeatureFlags<TFeatureFlags = Record<string, any>> = {
    experimentalAdminOmniSearch?: boolean;
    allowCmsLegacyRichTextInput?: boolean;
    newWatchCommand?: boolean;
} & TFeatureFlags;

let featureFlags: FeatureFlags = {};

// In API applications.
if (process.env.WEBINY_FEATURE_FLAGS) {
    featureFlags = JSON.parse(process.env.WEBINY_FEATURE_FLAGS) as FeatureFlags;

    // In React applications.
} else if (process.env.REACT_APP_WEBINY_FEATURE_FLAGS) {
    featureFlags = JSON.parse(process.env.REACT_APP_WEBINY_FEATURE_FLAGS) as FeatureFlags;
}

export { featureFlags };
