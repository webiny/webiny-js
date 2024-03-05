/**
 * The main `sendEvent` function.
 * NOTE: don't use this in your app directly. Instead, use the one from `cli.js` or `react.js` files accordingly.
 */
module.exports = ({ event, user, properties, wts } = {}) => {
    // 1. Check for existence of required base parameters.
    if (!event) {
        throw new Error(`Cannot send event - missing "event" name.`);
    }

    if (!user) {
        throw new Error(`Cannot send event - missing "user" ID.`);
    }

    if (!properties) {
        throw new Error(`Cannot send event - missing "properties" object.`);
    }

    if (!wts) {
        throw new Error(`Cannot send event - missing "wts" instance.`);
    }

    // 2. Extract properties and check for existence of required properties.
    if (!properties.version) {
        throw new Error(`Cannot send event - missing "version" property.`);
    }

    const hasCiProp = "ci" in properties;
    if (!hasCiProp) {
        throw new Error(`Cannot send event - missing "ci" boolean property.`);
    }

    const hasNewUserProp = "newUser" in properties;
    if (!hasNewUserProp) {
        throw new Error(`Cannot send event - missing "newUser" boolean property.`);
    }

    const finalProperties = {
        ...properties,
        newUser: properties.newUser === true ? "yes" : "no",
        ci: properties.ci === true ? "yes" : "no"
    };

    return wts.trackEvent(user, event, finalProperties);
};
