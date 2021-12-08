const parser = require("@babel/parser");
const { default: traverse } = require("@babel/traverse");
const fs = require("fs-extra");
const path = require("path");
const fsReadRecursive = require("fs-readdir-recursive");
const prettier = require("prettier");

module.exports = async ({ folder, context }) => {
    if (folder === ".") {
        folder = path.relative(context.paths.projectRoot, process.cwd());
    }

    console.log(`Generate tsconfig files in "${folder}"`);

    const files = fsReadRecursive(context.resolve(folder, "src"))
        .filter(name => name.endsWith(".ts") || name.endsWith(".tsx"))
        .map(name => context.resolve(folder, "src", name));

    const webinyPackages = new Set();

    await Promise.all(
        files.map(async file => {
            const code = await fs.readFile(file, {
                encoding: "utf8"
            });
            const ast = parser.parse(code, {
                plugins: ["typescript", "jsx", "classProperties"],
                sourceType: "module"
            });

            traverse(ast, {
                ImportDeclaration: ({ node }) => {
                    if (node.source.value.startsWith("@webiny/")) {
                        webinyPackages.add(node.source.value.split("/").slice(0, 2).join("/"));
                    }
                }
            });
        })
    );

    // TODO: calculate relative path for `extends` and `references`

    const tsConfig = {
        extends: "../../tsconfig.json",
        references: [],
        compilerOptions: {
            baseUrl: ".",
            paths: {
                "~/*": ["./src/*"]
            }
        }
    };

    const tsBuildConfig = {
        extends: "../tsconfig.build.json",
        include: ["src"],
        exclude: ["node_modules", "**/__tests__/**", "./dist"],
        references: [],
        compilerOptions: {
            rootDir: "./src",
            outDir: "./dist",
            declarationDir: "./dist",
            baseUrl: ".",
            paths: {
                "~/*": ["./src/*"]
            }
        }
    };

    Array.from(webinyPackages)
        .sort()
        .forEach(pkg => {
            const pkgFolder = pkg.split("/")[1];
            tsConfig.references.push({ path: `../${pkgFolder}` });
            tsConfig.compilerOptions.paths[`${pkg}/*`] = [`../${pkgFolder}/src/*`];
            tsConfig.compilerOptions.paths[pkg] = [`../${pkgFolder}/src`];

            tsBuildConfig.exclude.push(`../${pkgFolder}`);
        });

    const prettierRc = { ...require(context.resolve(".prettierrc.js")), parser: "json" };

    await Promise.all([
        fs.writeFile(
            context.resolve(folder, "tsconfig.json"),
            prettier.format(JSON.stringify(tsConfig), prettierRc)
        ),
        fs.writeFile(
            context.resolve(folder, "tsconfig.build.json"),
            prettier.format(JSON.stringify(tsBuildConfig), prettierRc)
        )
    ]);
};
