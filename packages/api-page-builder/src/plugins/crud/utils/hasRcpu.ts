export default (permission, rcpu) => {
    if (typeof permission.rcpu !== "string") {
        return true;
    }

    return permission.rcpu.includes(rcpu);
};
