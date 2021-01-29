const consoleMethods = [
    "assert",
    "debug",
    "dir",
    "error",
    "group",
    "groupCollapsed",
    "groupEnd",
    "info",
    "log",
    "table",
    "warn"
];

const originalMethods: Record<string, any> = {};
const skipOriginal = ["table"];

const restoreOriginalMethods = () => {
    for (const method of consoleMethods) {
        console[method] = originalMethods[method];
    }
};

export const interceptConsole = callback => {
    if (console["__WEBINY__"] === true) {
        restoreOriginalMethods();
    }

    console["__WEBINY__"] = true;

    for (const method of consoleMethods) {
        originalMethods[method] = console[method];
        console[method] = (...args) => {
            callback(method, args);
            if (skipOriginal.includes(method)) {
                return;
            }
            originalMethods[method](...args);
        };
    }
};
