import dotProp from "dot-prop-immutable";
import { LIST_TARGETS } from "./graphql";

export const addToListCache = (cache, target) => {
    const gqlParams = { query: LIST_TARGETS };

    const { targets } = cache.readQuery(gqlParams);

    cache.writeQuery({
        ...gqlParams,
        data: {
            targets: dotProp.set(targets, `listTargets.data`, [target, ...targets.listTargets.data])
        }
    });
};

export const updateToListCache = (cache, target) => {
    const gqlParams = { query: LIST_TARGETS };
    const { targets } = cache.readQuery(gqlParams);
    const index = targets.listTargets.data.findIndex(item => item.id === target.id);

    cache.writeQuery({
        ...gqlParams,
        data: {
            targets: dotProp.set(targets, `listTargets.data.${index}`, target)
        }
    });
};

export const removeFromListCache = (cache, target) => {
    const gqlParams = { query: LIST_TARGETS };
    const { targets } = cache.readQuery(gqlParams);
    const index = targets.listTargets.data.findIndex(item => item.id === target.id);

    cache.writeQuery({
        ...gqlParams,
        data: {
            targets: dotProp.delete(targets, `listTargets.data.${index}`)
        }
    });
};
