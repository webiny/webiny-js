export default body => {
    if (typeof body === "string") {
        try {
            return JSON.parse(body);
        } catch {
            return {};
        }
    }
    return body;
};
