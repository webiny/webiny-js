import stripAnsi from "strip-ansi";
import jsesc from "jsesc";

/**
 * The main `sendEvent` function.
 * NOTE: don't use this in your app directly. Instead, use the one from `cli.js` or `react.js` files accordingly.
 *
 * Identity is owned by the WTS instance — `cli.js` reads `~/.webiny/config`,
 * `react.js` reads URL params / localStorage / env. This function only
 * validates and sanitises the event payload before dispatching.
 */
export default ({ event, properties, wts } = {}) => {
    if (!event) {
        throw new Error(`Cannot send event - missing "event" name.`);
    }

    if (!properties) {
        throw new Error(`Cannot send event - missing "properties" object.`);
    }

    if (!wts) {
        throw new Error(`Cannot send event - missing "wts" instance.`);
    }

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

    const sanitizedProperties = {
        ...properties,
        newUser: properties.newUser === true ? "yes" : "no",
        ci: properties.ci === true ? "yes" : "no"
    };

    for (const key in sanitizedProperties) {
        let sanitizedValue = sanitizedProperties[key];
        if (typeof sanitizedValue === "string") {
            sanitizedValue = sanitizedValue.trim();
            sanitizedValue = stripAnsi(sanitizedValue);
            sanitizedValue = jsesc(sanitizedValue);
        }

        sanitizedProperties[key] = sanitizedValue;
    }

    return wts.track(event, sanitizedProperties);
};
