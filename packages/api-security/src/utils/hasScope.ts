import minimatch from "minimatch";

export default (requiredScope, scopesList) => {
    if (!Array.isArray(scopesList)) {
        return false;
    }

    for (let i = 0; i < scopesList.length; i++) {
        const scopesListScope = scopesList[i];
        if (minimatch(requiredScope, scopesListScope)) {
            return true;
        }
    }

    return false;
};
