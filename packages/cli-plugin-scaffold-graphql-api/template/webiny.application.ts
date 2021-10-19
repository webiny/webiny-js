export default {
    id: "projectApplicationName",
    name: "Project application name",
    description: "Project application description",
    cli: {
        // Default args for the "yarn webiny watch ..." command.
        watch: {
            // Watch five levels of dependencies, starting from this project application.
            depth: 5
        }
    }
};
