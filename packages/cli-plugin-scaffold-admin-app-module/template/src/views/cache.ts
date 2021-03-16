import dotProp from "dot-prop-immutable";
import { LIST_TARGETS } from "./graphql";

export const addToListCache = (cache, variables, target) => {
    const gqlParams = { query: LIST_TARGETS, variables };

    let result;
    try {
        result = cache.readQuery(gqlParams);
    } catch {
        return;
    }
    const { targets } = result;

    cache.writeQuery({
        ...gqlParams,
        data: {
            targets: dotProp.set(targets, `listTargets.data`, [target, ...targets.listTargets.data])
        }
    });
};

export const updateToListCache = (cache, variables, target) => {
    const gqlParams = { query: LIST_TARGETS, variables };

    let result;
    try {
        result = cache.readQuery(gqlParams);
    } catch {
        return;
    }
    const { targets } = result;

    const index = targets.listTargets.data.findIndex(item => item.id === target.id);

    cache.writeQuery({
        ...gqlParams,
        data: {
            targets: dotProp.set(targets, `listTargets.data.${index}`, target)
        }
    });
};

export const removeFromListCache = (cache, variables, target) => {
    const gqlParams = { query: LIST_TARGETS, variables };

    let result;
    try {
        result = cache.readQuery(gqlParams);
    } catch {
        return;
    }
    const { targets } = result;

    const index = targets.listTargets.data.findIndex(item => item.id === target.id);

    cache.writeQuery({
        ...gqlParams,
        data: {
            targets: dotProp.delete(targets, `listTargets.data.${index}`)
        }
    });
};
