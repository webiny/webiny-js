export default {
    id: "myFullStackApplication",
    name: "My Full Stack Application",
    description: "This is the My Full Stack Application React application.",
    cli: {
        // Default args for the "yarn webiny watch ..." command (we don't need deploy option while developing).
        watch: {
            deploy: false
        }
    }
};
