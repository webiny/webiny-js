module.exports = {
    printWidth: 100,
    parser: "babel",
    tabWidth: 4,
    overrides: [
        {
            files: "*.json",
            options: {
                parser: "json"
            }
        },
        {
            files: "*.md",
            options: {
                parser: "markdown"
            }
        }
    ]
};
