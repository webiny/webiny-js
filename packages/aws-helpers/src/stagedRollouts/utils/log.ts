export function logDebug(...args: any[]) {
    // If DEBUG variable is not set during build,
    // this function should be minified to an empty one and removed completely from the bundle.
    if (process.env.DEBUG === "true") {
        console.log(...args);
    }
}
