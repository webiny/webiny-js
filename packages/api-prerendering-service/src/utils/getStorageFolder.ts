export default (args, configuration) => {
    const folder = args?.configuration?.storage.folder ?? configuration?.storage?.folder;
    return typeof folder === "string" ? folder : "";
};
