import type { IReportedEnvironment } from "../../shared/types.js";

/*
 * The environment as label and value pairs, in the order both clipboard formats print them, so the
 * plain and HTML copies cannot drift apart.
 */
export function toEnvironmentRows(environment: IReportedEnvironment): [string, string][] {
    return [
        ["Page", environment.page],
        ["URL", environment.url],
        ["Viewport", environment.viewport],
        ["Browser", environment.userAgent],
        ["Language", environment.language],
        ["Timezone", environment.timezone],
        ["Captured", environment.capturedAt]
    ];
}
