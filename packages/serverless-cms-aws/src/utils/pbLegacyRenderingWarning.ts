import { CliContext } from "@webiny/cli/types";
import { featureFlags } from "@webiny/feature-flags";

// @deprecation-warning pb-legacy-rendering-engine
export const isLegacyRenderingEngine = featureFlags.pbLegacyRenderingEngine === true;

const DOCS_LINK = "https://www.webiny.com/docs/page-builder-rendering-upgrade.";

const hook = async (params: Record<string, any>, context: CliContext) => {
    if (!isLegacyRenderingEngine) {
        return;
    }

    const message = [
        "You're currently using the legacy Webiny Page Builder page rendering engine, which will become",
        `deprecated starting ${context.warning.hl("July 1st, 2023")}.`,
        `For more information about the new rendering engine and the upgrade guide, please visit: ${DOCS_LINK}`
    ].join(" ");

    console.log();
    context.warning(message);
    console.log();

    await new Promise(resolve => {
        setTimeout(resolve, 2000);
    });
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
