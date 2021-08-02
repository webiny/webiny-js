/**
 * For more information on the Admin Area project application, please see:
 * https://www.webiny.com/docs/key-topics/cloud-infrastructure/admin/introduction
 */
export default {
    id: "projectApplicationId",
    name: "Project application name",
    description: "Project application description",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    }
};
