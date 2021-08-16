export default {
    id: "projectApplicationName",
    name: "Project application name",
    description: "Project application description",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    }
};
