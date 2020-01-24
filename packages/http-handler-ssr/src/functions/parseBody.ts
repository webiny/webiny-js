export default body => {
    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch {
            // Do nothing.
        }
    }
    return {};
};
