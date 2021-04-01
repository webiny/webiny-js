/**
 * For more information on the Admin Area project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/admin/introduction
 */
module.exports = {
    id: "admin",
    name: "Admin Area",
    description: "Your project's admin area.",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    }
};
