let featureFlags: Record<string, any> = {
    pbLexicalEditor: false
};

// In API applications.
if (process.env.WEBINY_FEATURE_FLAGS) {
    featureFlags = JSON.parse(process.env.WEBINY_FEATURE_FLAGS);

    // In React applications.
} else if (process.env.REACT_APP_WEBINY_FEATURE_FLAGS) {
    featureFlags = JSON.parse(process.env.REACT_APP_WEBINY_FEATURE_FLAGS);
}

export { featureFlags };
