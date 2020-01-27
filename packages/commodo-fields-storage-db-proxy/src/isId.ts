export default value => {
    if (typeof value === "string") {
        return value.match(new RegExp("^[0-9a-fA-F]{24}$")) !== null;
    }

    return false;
};
