export default (args: Record<string, any>, configuration: Record<string, any>) => {
    return args?.configuration?.db?.namespace || configuration?.db?.folder?.namepace || "";
};
