export default (existingNormalizedQueries, normalizedQueries) => {
    for (const queryKey in normalizedQueries) {
        if (!existingNormalizedQueries[queryKey]) {
            existingNormalizedQueries[queryKey] = {};
        }

        for (const variablesKey in normalizedQueries[queryKey]) {
            existingNormalizedQueries[queryKey][variablesKey] =
                normalizedQueries[queryKey][variablesKey];
        }
    }
};
