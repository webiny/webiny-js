module.exports.handler = (event, context) => {
    const { handler } = process.env.IS_OFFLINE ? require("./offline") : require("./online");
    return handler(event, context);
};
