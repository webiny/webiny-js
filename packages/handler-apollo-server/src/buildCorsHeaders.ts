export default (additionalHeaders = {}) => ({
    ...additionalHeaders,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
});
