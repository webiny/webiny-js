export default {
    type: "context",
    apply(context) {
        context.http = {
            query: null,
            body: null,
            path: null,
            headers: null,
            cookies: null
        };
    }
};
