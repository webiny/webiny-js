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
const skipOriginal: string[] = ["table"];

const restoreOriginalMethods = () => {
    for (const method of consoleMethods) {
        // @ts-expect-error
        console[method] = originalMethods[method];
    }
};

interface InterceptConsoleCallable {
    (method: string, args: any[]): void;
}

export const interceptConsole = (callback: InterceptConsoleCallable) => {
    // @ts-expect-error
    if (console["__WEBINY__"] === true) {
        restoreOriginalMethods();
    }

    // @ts-expect-error
    console["__WEBINY__"] = true;

    for (const method of consoleMethods) {
        // @ts-expect-error
        originalMethods[method] = console[method];
        // @ts-expect-error
        console[method] = (...args) => {
            callback(method, args);
            if (skipOriginal.includes(method)) {
                return;
            }
            originalMethods[method](...args);
        };
    }
};
