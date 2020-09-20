export default () => ({
    type: "context",
    apply(context) {
        context.invocationArgs = {};
    }
});
