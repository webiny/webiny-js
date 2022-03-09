export const stageCookie = "webiny-stage";
export const stageHeader = "webiny-stage";

export function pointsToFile(uri: string) {
    return /\/[^/]+\.[^/]+$/.test(uri);
}
