import isPrimitiveValue from "./isPrimitiveValue";

const getId = data => data && data.id;

const normalize = resultFragment => {
    const id = getId(resultFragment);

    if (id) {
        const normalizedResultFragmentEntities: Record<string, any> = {};
        const normalizedResultFragment: Record<string, any> = {
            __entity: {
                id,
                fields: []
            }
        };

        const entity: Record<string, any> = {};
        for (const key in resultFragment) {
            const value = resultFragment[key];
            if (isPrimitiveValue(value)) {
                entity[key] = value;
                normalizedResultFragment.__entity.fields.push(key);
                continue;
            }

            if (Array.isArray(value)) {
                normalizedResultFragment[key] = [];
                value.forEach(item => {
                    const [normalizedItem, normalizedItemEntities] = normalize(item);
                    normalizedResultFragment[key].push(normalizedItem);
                    Object.assign(normalizedResultFragmentEntities, normalizedItemEntities);
                });
                continue;
            }

            const [normalizedValue, normalizedValueEntities] = normalize(value);
            normalizedResultFragment[key] = normalizedValue;
            Object.assign(normalizedResultFragmentEntities, normalizedValueEntities);
        }

        if (!normalizedResultFragmentEntities[entity.id]) {
            normalizedResultFragmentEntities[entity.id] = {};
        }
        Object.assign(normalizedResultFragmentEntities[entity.id], entity);

        return [normalizedResultFragment, normalizedResultFragmentEntities];
    }

    const normalizedResultFragmentEntities: Record<string, any> = {};
    const normalizedResultFragment: Record<string, any> = {};
    for (const key in resultFragment) {
        const value = resultFragment[key];
        if (isPrimitiveValue(value)) {
            normalizedResultFragment[key] = value;
            continue;
        }

        if (Array.isArray(value)) {
            normalizedResultFragment[key] = [];
            value.forEach(item => {
                const [normalizedItem, normalizedItemEntities] = normalize(item);
                normalizedResultFragment[key].push(normalizedItem);
                Object.assign(normalizedResultFragmentEntities, normalizedItemEntities);
            });
            continue;
        }

        const [normalizedValue, normalizedValueEntities] = normalize(value);
        normalizedResultFragment[key] = normalizedValue;
        Object.assign(normalizedResultFragmentEntities, normalizedValueEntities);
    }

    return [normalizedResultFragment, normalizedResultFragmentEntities];
};

export default normalize;
