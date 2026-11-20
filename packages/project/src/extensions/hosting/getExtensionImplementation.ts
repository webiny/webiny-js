import { extensionImplementations } from "./extensionImplementations.js";

export const getExtensionImplementation = (type: string) => {
    const hostingType = process.env.WEBINY_HOSTING_TYPE;
    if (!hostingType) {
        return undefined;
    }
    return extensionImplementations.get(`${hostingType}:${type}`);
};
