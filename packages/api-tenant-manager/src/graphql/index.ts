import tenants from "./tenants";
// import themes from "./themes";

export default () => {
    const plugins = [tenants];
    if (process.env.NODE_ENV !== "test") {
        // plugins.push(themes);
    }

    return plugins;
};
