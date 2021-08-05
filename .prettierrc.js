module.exports = {
    printWidth: 100,
    trailingComma: "none",
    tabWidth: 2,
    arrowParens: "avoid",
    overrides: [
        {
            files: ["*.js", "*.ts", "*.tsx"],
            options: {
                tabWidth: 4
            }
        }
    ]
};
