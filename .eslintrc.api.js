module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module"
    },
    plugins: ["@typescript-eslint"],
    env: {
        node: true
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    settings: {
        "import/resolver": {
            node: {
                extensions: [".js", ".ts"]
            }
        }
    }
};
