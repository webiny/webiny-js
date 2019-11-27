import lumigo from "@lumigo/tracer";

export default ({ token, enabled = true }) => ({
    name: "apollo-handler-wrapper-http-logger",
    type: "apollo-handler-wrapper",
    async wrap({ handler }) {
        if (!enabled) {
            return handler;
        }

        return lumigo({ token }).trace(handler);
    }
});
