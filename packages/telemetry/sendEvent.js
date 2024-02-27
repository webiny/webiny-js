const { WTS } = require("wts/src/node");

/**
 * The main `sendEvent` function.
 * NOTE: don't use this in your app directly. Instead, use the one from `cli.js` or `react.js` files accordingly.
 */
module.exports = ({ event, user, version, ci, newUser, properties, extraPayload } = {}) => {
    if (!event) {
        throw new Error(`Cannot send event - missing "event" name.`);
    }

    if (!user) {
        throw new Error(`Cannot send event - missing "user" property.`);
    }

    if (!version) {
        throw new Error(`Cannot send event - missing "version" property.`);
    }

    if (typeof ci === "undefined") {
        throw new Error(`Cannot send event - missing "ci" boolean property.`);
    }

    if (typeof newUser === "undefined") {
        throw new Error(`Cannot send event - missing "newUser" boolean property.`);
    }

    if (!properties) {
        properties = {};
    }

    if (!extraPayload) {
        extraPayload = {};
    }

    const wts = new WTS();
    wts.trackEvent(user, event, {
        ...properties,
        newUser: newUser ? "yes" : "no",
        version,
        ci: ci ? "yes" : "no"
    });
};
