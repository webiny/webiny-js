/**
 * Implement your function here. To make it accessible on the internet, add the following entry to the
 * "api.inputs.endpoints" array, in the "/api/resources.js" file:
 *
 * {
 *   path: "/some-route",
 *   method: "ANY",
 *   function: "${FUNCTION_NAME.arn}",
 * }
 */
export const handler = async (event, context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Hello from my new function!", event, context })
    };
};
