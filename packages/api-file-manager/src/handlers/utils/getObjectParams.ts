import getEnvironment from "./getEnvironment";

/**
 * Returns website's Bucket and file's Key values.
 * @param filename
 * @returns {{Bucket: string, Key: string}}
 */
export default filename => {
    const { bucket: Bucket } = getEnvironment();

    return {
        Bucket,
        Key: `${filename}`
    };
};
