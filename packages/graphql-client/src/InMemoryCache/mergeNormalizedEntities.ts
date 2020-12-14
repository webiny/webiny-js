export default (existingNormalizedEntities, normalizedEntities) => {
    for (const entityType in normalizedEntities) {
        if (!existingNormalizedEntities[entityType]) {
            existingNormalizedEntities[entityType] = {};
        }

        for (const entityId in normalizedEntities[entityType]) {
            if (!existingNormalizedEntities[entityType][entityId]) {
                existingNormalizedEntities[entityType][entityId] = {};
            }

            Object.assign(
                existingNormalizedEntities[entityType][entityId],
                normalizedEntities[entityType][entityId]
            );
        }
    }
};
