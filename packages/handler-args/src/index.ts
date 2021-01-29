/**
 * This is the default handling of function invocation arguments.
 * You can access the "event" object via "context.invocationArgs" anywhere in your code.
 */
export default () => ({
    type: "context",
    apply(context) {
        const [event] = context.args;
        context.invocationArgs = event;
    }
});
