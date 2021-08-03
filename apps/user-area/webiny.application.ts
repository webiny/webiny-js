/**
 * For more information on the Admin Area project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/admin/introduction
 */
export default {
    id: "userArea",
    name: "User Area",
    description: "This is the User Area app.",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    }
};
