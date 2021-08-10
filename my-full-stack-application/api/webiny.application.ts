export default {
    id: "myFullStackApplication",
    name: "My Full Stack Application",
    description: "This is the My Full Stack Application React application.",
    cli: {
        // Default args for the "yarn webiny watch ..." command.
        watch: {
            // Watch five levels of dependencies, starting from this project application.
            depth: 5
        }
    }
};
