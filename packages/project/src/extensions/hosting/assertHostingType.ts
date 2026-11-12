import type { ExtensionHosting } from "./hostingType.js";
import type { HostingType } from "./hostingType.js";

const HOSTING_TYPE_LABELS: Record<HostingType, string> = {
    aws: "AWS",
    standalone: "standalone"
};

/**
 * Throws if the project's hosting type is not the one an extension is for.
 *
 * `webiny/extensions` exposes one set of namespaces for every project, so `Infra.Vpc` can be
 * imported in a standalone project and `Infra.Sqlite` in an AWS one. Rendering either in the
 * wrong project throws, instead of the extension being skipped because the hosting package never
 * registered its definition.
 *
 * The current hosting type comes from `WEBINY_HOSTING_TYPE`, which the `webiny` bin of
 * `@webiny/cli-aws` and `@webiny/cli-standalone` sets. When it isn't set, nothing is checked.
 */
export const assertHostingType = (name: string, hosting: ExtensionHosting) => {
    const current = process.env.WEBINY_HOSTING_TYPE;
    if (hosting === "all" || !current || current === hosting) {
        return;
    }

    throw new Error(
        `"${name}" is only available in ${HOSTING_TYPE_LABELS[hosting]} projects. This project's hosting type is "${current}".`
    );
};
