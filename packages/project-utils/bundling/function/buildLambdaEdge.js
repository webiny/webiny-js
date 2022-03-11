const rollup = require("rollup");
const esbuild = require("rollup-plugin-esbuild");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const { babel } = require("@rollup/plugin-babel");
const virtual = require("@rollup/plugin-virtual");
const json = require("@rollup/plugin-json");

module.exports = async function (fileContent) {
    const inputOptions = {
        input: "~index",
        plugins: [
            virtual({
                "~index": fileContent
            }),
            nodeResolve(),
            commonjs(),
            json(),
            esbuild.default({
                define: {
                    "process.env": JSON.stringify(process.env)
                }
            }),
            babel({
                babelHelpers: "bundled",
                extensions: [".ts", ".js", ".cjs", ".mjs"],
                presets: [
                    [
                        "@babel/preset-env",
                        {
                            targets: {
                                node: 12
                            }
                        }
                    ]
                ]
            })
        ],
        onwarn: warning => {
            // this warning we can safely ignore
            // https://stackoverflow.com/a/43556986/2202583
            if (warning.code === "THIS_IS_UNDEFINED") {
                return;
            }

            // console.warn everything else
            console.warn(warning.message);
        }
    };

    const outputOptions = {
        format: "cjs",
        exports: "named"
    };

    // create a bundle
    const bundle = await rollup.rollup(inputOptions);

    // generate output specific code in-memory
    // you can call this function multiple times on the same bundle object
    const { output } = await bundle.generate(outputOptions);

    await bundle.close();

    return output[0];
};
