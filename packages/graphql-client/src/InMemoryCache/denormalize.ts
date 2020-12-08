import isPrimitiveValue from "./isPrimitiveValue";

const denormalize = (normalizedDataFragment, entities) => {
    const denormalizedDataFragment = {};
    for (const key in normalizedDataFragment) {
        if (key === "__entity") {
            const { id: entityId, fields: entityFields } = normalizedDataFragment[key];
            entityFields.forEach(field => {
                denormalizedDataFragment[field] = entities[entityId][field];
            });
            continue;
        }

        if (isPrimitiveValue(normalizedDataFragment[key])) {
            denormalizedDataFragment[key] = normalizedDataFragment[key];
            continue;
        }

        if (Array.isArray(normalizedDataFragment[key])) {
            denormalizedDataFragment[key] = normalizedDataFragment[key].map(item =>
                denormalize(item, entities)
            );
            continue;
        }

        denormalizedDataFragment[key] = denormalize(normalizedDataFragment[key], entities);
    }

    return denormalizedDataFragment;
};

export default denormalize;
