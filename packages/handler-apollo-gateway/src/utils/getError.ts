function getError(error) {
    let err = error?.extensions?.response;
    if (err) {
        const body = JSON.parse(err.body);
        return {
            error: body.error.message,
            stack: err.stack
        };
    }

    err = error?.extensions.exception;
    if (err) {
        return {
            error: error.message,
            stack: err.stacktrace
        };
    }

    if (error.error) {
        return { error: error.error };
    }

    return { error };
}

export default getError;
