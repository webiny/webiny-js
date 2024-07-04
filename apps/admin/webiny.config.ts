import { createAdminAppConfig } from "@webiny/serverless-cms-aws";
// @ts-ignore `traverseLoaders` has no type declarations.
import { traverseLoaders } from "@webiny/project-utils/traverseLoaders";
import tailwindcss from "tailwindcss";

export default createAdminAppConfig(({ config }) => {
    /**
     * Add a webpack config modifier.
     */
    config.webpack(config => {
        /**
         * Traverse all loaders, find `postcss-loader`, and overwrite plugins.
         */
        traverseLoaders(config.module?.rules, (loader: any) => {
            /**
             * `loader` can also be a string, so check for `.loader` property.
             */
            if (loader.loader && loader.loader.includes("postcss-loader")) {
                loader.options.postcssOptions.plugins = [
                    ...loader.options.postcssOptions.plugins(),
                    tailwindcss()
                ];
            }
        });

        return config;
    });
});
