export default async config => {
    const { default: server } = await (process.env.NODE_ENV === "production"
        ? import("./production")
        : import("./development"));
    return server(config);
};
