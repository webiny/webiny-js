import getTypename from "./getTypename";

const denormalizeFragment = (normalizedDataFragment, entities) => {
    const typename = getTypename(normalizedDataFragment);
    if (!typename) {
        return normalizedDataFragment;
    }

    const denormalizedDataFragment = {};
    for (const key in normalizedDataFragment) {
        if (Array.isArray(normalizedDataFragment[key])) {
            denormalizedDataFragment[key] = normalizedDataFragment[key].map(item =>
                denormalizeFragment(item, entities)
            );
            continue;
        }

        if (key === "__entity") {
            const {
                id: entityId,
                fields: entityFields,
            } = normalizedDataFragment[key];

            entityFields.forEach(field => {
                denormalizedDataFragment[field] = entities[typename][entityId][field];
            });
            continue;
        }

        denormalizedDataFragment[key] = denormalizeFragment(normalizedDataFragment[key], entities);
    }

    return denormalizedDataFragment;
};

const denormalize = (normalizedData, normalizedEntities) => {
    const denormalizedData = {};
    for (const fragmentKey in normalizedData) {
        denormalizedData[fragmentKey] = denormalizeFragment(
            normalizedData[fragmentKey],
            normalizedEntities
        );
    }

    return denormalizedData;
};

export default denormalize;
