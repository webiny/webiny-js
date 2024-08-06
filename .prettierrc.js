/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
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
    ],
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindConfig: __dirname + "/packages/admin/tailwind.config.ts",
    tailwindFunctions: ["cn", "cva", "clsx", "twMerge", "tw"]
};

module.exports = config;
