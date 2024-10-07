export interface GenericRecord {
    [key: string]: any;
}
export const log = (message: string | GenericRecord | string[], debug = "true") => {
    if (process.env.DEBUG !== debug) {
        return;
    }
    console.log(message);
};
