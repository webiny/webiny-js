import { CliContext } from "@webiny/cli/types";
import { featureFlags } from "@webiny/feature-flags";

// @deprecation-warning pb-legacy-rendering-engine
export const isLegacyRenderingEngine = featureFlags.pbLegacyRenderingEngine === true;

const DOCS_LINK = "https://webiny.link/pb-legacy-rendering-deprecation";

const hook = async (_: Record<string, any>, context: CliContext) => {
    if (isLegacyRenderingEngine) {
        const message = [
            "It seems that the Webiny's Page Builder legacy rendering engine is still enabled",
            `(detected %s in %s file).`,
            "With 5.37.0 version of Webiny, the legacy rendering engine has been fully deprecated.",
            `Learn more: ${DOCS_LINK}.`
        ].join(" ");

        console.log();
        context.warning(message, "pbLegacyRenderingWarningPlugins: true", "webiny.ts");
        console.log();

        await new Promise(resolve => {
            setTimeout(resolve, 5000);
        });
    }
};

export const pbLegacyRenderingWarningPlugins = [
    {
        type: "hook-before-watch",
        name: "hook-before-watch-pb-legacy-rendering-warning",
        hook
    },
    {
        type: "hook-before-build",
        name: "hook-before-build-pb-legacy-rendering-warning",
        hook
    }
];
