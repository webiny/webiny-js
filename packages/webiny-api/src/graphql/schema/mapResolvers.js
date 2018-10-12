const omit = key => ["Subscription"].includes(key);

const maybeMap = (key, fn, obj) => (omit(key) ? obj[key] : fn(obj[key], key, obj));

const mapObj = fn => obj => {
    if (obj.constructor.name === "Object") {
        return Object.keys(obj).reduce(
            (acc, key) => ({
                ...acc,
                [key]: maybeMap(key, fn, obj)
            }),
            {}
        );
    } else {
        return obj;
    }
};

const checkFn = (fn, fieldName) => {
    if (typeof fn !== "function") {
        throw new Error(`Expected Function for ${fieldName} resolver but received ${typeof fn}`);
    }
};

const wrapFn = namespace => (fn, fieldName) => {
    checkFn(fn, fieldName);
    return (root, args, context, info) => fn(root, args, context, info);
};

export default (namespace, resolvers) => {
    if (resolvers instanceof Object) {
        return mapObj(mapObj(wrapFn(namespace)))(resolvers);
    }
};
