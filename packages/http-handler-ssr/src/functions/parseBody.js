export default event => {
    if (typeof event.body === "string") {
        try {
            return JSON.parse(event.body);
        } catch {
            // Do nothing.
        }
    }
    return {};
};
