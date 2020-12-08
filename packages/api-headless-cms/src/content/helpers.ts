export type CmsHttpParametersType = {
    type: string;
    environment: string;
    locale: string;
};
const throwError = (type: string): void => {
    throw new Error(`Missing path parameter "${type}".`);
};
export const extractHandlerHttpParameters = (context: any): CmsHttpParametersType => {
    const { key = "" } = context.http.path.parameters || {};
    const [type, environment, locale] = key.split("/");
    if (!type) {
        throwError("type");
    } else if (!environment || environment.match(/^([a-zA-Z0-9\-]+)$/) === null) {
        throwError("environment");
    } else if (!locale || locale.match(/^([a-zA-Z]{2})-([a-zA-Z]{2})$/) === null) {
        throwError("locale");
    }
    return {
        // content model group?
        type,
        // environment slug?
        environment,
        // locale slug?
        locale
    };
};
