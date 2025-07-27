import { createBundler } from "~/resolver/app/bundler/Bundler.js";
import { createBundles } from "~/resolver/app/bundler/Bundles.js";
import { createCommandBundle } from "~/resolver/app/bundler/CommandBundle.js";
import { createTableBundle } from "~/resolver/app/bundler/TableBundle.js";

export const createMockCommandBundler = () => {
    return createBundler({
        createBundles: () => {
            return createBundles({
                createBundle: createCommandBundle
            });
        }
    });
};

export const createMockTableBundler = () => {
    return createBundler({
        createBundles: () => {
            return createBundles({
                createBundle: createTableBundle
            });
        }
    });
};
