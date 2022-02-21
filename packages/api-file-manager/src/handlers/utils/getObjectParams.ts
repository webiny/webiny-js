import getEnvironment from "./getEnvironment";

export interface ObjectParamsResponse {
    Bucket: string;
    Key: string;
}
/**
 * Returns website's Bucket and file's Key values.
 */
export default (filename: string): ObjectParamsResponse => {
    const { bucket: Bucket } = getEnvironment();

    return {
        Bucket,
        Key: `${filename}`
    };
};
