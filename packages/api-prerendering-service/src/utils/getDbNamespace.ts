export default (args, configuration) => {
    return args?.configuration?.db?.namespace || configuration?.db?.folder?.namepace || "";
};
