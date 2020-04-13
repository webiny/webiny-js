module.exports = {
    parser: "babel",
    printWidth: 100,
    tabWidth: 2,
    overrides: [
        {
            files: ["*.js", "*.ts", "*.tsx"],
            options: {
                tabWidth: 4
            }
        }
    ]
};
