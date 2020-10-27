export default ({ filesFilePermission, rwd }) => {
    if (typeof filesFilePermission.rwd !== "string") {
        return true;
    }

    return filesFilePermission.rwd.includes(rwd);
};
