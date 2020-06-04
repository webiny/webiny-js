export default body => {
    if (body.errors) {
        throw body.errors;
    }

    const { data, error } = body.data.content;
    if (error) {
        throw error;
    }

    return data;
};
