/**
 * For more information on the Admin Area project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/admin/introduction
 */
export default {
    id: "myNewReactApplication",
    name: "My New React Application",
    description: "This is a React application created via the New React Application scaffold.",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    }
};
