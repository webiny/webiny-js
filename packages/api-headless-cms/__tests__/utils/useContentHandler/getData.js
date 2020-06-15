export default body => {
    if (body.errors) {
        throw body.errors;
    }

    if (typeof body.data.content === "object") {
        const { data, error } = body.data.content;
        if (error) {
            throw error;
        }
        return data;
    }

    return body.data.content;
};
