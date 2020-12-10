import getTypename from "./getTypename";
import getId from "./getId";
import mergeNormalizedEntities from "./mergeNormalizedEntities";

const normalizeFragment = resultFragment => {
    if (Array.isArray(resultFragment)) {
        const normalizedResultFragmentEntities: Record<string, any> = {};
        const normalizedResultFragment: Record<string, any> = [];

        resultFragment.forEach(item => {
            const [normalizedItem, normalizedItemEntities] = normalizeFragment(item);
            normalizedResultFragment.push(normalizedItem);
            mergeNormalizedEntities(normalizedResultFragmentEntities, normalizedItemEntities);
        });

        return [normalizedResultFragment, normalizedResultFragmentEntities];
    }

    const typename = getTypename(resultFragment);
    if (!typename) {
        return [resultFragment, {}];
    }

    const id = getId(resultFragment);

    if (id) {
        const entity = {};
        const normalizedResultFragmentEntities: Record<string, any> = {};
        const normalizedResultFragment: Record<string, any> = {
            __entity: {
                id,
                fields: []
            }
        };

        for (const key in resultFragment) {
            const value = resultFragment[key];
            if (key === "__typename") {
                normalizedResultFragment[key] = value;
                continue;
            }

            const [normalizedValue, normalizedValueEntities] = normalizeFragment(value);
            if (Object.keys(normalizedValueEntities).length > 0) {
                normalizedResultFragment[key] = normalizedValue;
                mergeNormalizedEntities(normalizedResultFragmentEntities, normalizedValueEntities);
                continue;
            }

            entity[key] = normalizedValue;
            normalizedResultFragment.__entity.fields.push(key);
        }

        if (!normalizedResultFragmentEntities[typename]) {
            normalizedResultFragmentEntities[typename] = {};
        }

        if (!normalizedResultFragmentEntities[typename][id]) {
            normalizedResultFragmentEntities[typename][id] = {};
        }

        Object.assign(normalizedResultFragmentEntities[typename][id], entity);

        return [normalizedResultFragment, normalizedResultFragmentEntities];
    }

    const normalizedResultFragmentEntities: Record<string, any> = {};
    const normalizedResultFragment: Record<string, any> = {};
    for (const key in resultFragment) {
        const value = resultFragment[key];
        const [normalizedValue, normalizedValueEntities] = normalizeFragment(value);
        normalizedResultFragment[key] = normalizedValue;
        mergeNormalizedEntities(normalizedResultFragmentEntities, normalizedValueEntities);
    }

    return [normalizedResultFragment, normalizedResultFragmentEntities];
};

const normalize = result => {
    const normalizedResult: Record<string, any> = {};
    const normalizedResultEntities: Record<string, any> = {};
    for (const fragmentKey in result) {
        const [normalizedFragment, normalizedFragmentEntities] = normalizeFragment(
            result[fragmentKey]
        );

        normalizedResult[fragmentKey] = normalizedFragment;
        mergeNormalizedEntities(normalizedResultEntities, normalizedFragmentEntities);
    }

    return [normalizedResult, normalizedResultEntities];
};

export default normalize;
