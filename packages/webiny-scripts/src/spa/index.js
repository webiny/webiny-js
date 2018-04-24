export { default as SpaConfigPlugin } from "./plugins/SpaConfigPlugin";
export { default as server } from "./server";

export function appEntry(entry) {
    if (process.env.NODE_ENV === "production") {
        return entry;
    }

    return [
        "webpack-hot-middleware/client?path=/__webpack_hmr&quiet=false&noInfo=true&warn=false&overlay=true&reload=false",
        entry
    ];
}
