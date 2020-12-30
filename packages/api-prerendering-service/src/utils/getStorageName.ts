export default (args, configuration) => {
    return args?.configuration?.storage.name || configuration?.storage.name;
};
