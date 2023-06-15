export const getDefaultPrefix = () => {
    return new Date().toISOString().replace(/\.|\:/g, "-").toLowerCase() + "-";
};
