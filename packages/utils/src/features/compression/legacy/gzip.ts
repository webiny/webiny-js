import zlib from "node:zlib";

export const compress = (input: zlib.InputType, options?: zlib.ZlibOptions): Promise<Buffer> => {
    return new Promise(function (resolve, reject) {
        zlib.gzip(input, options || {}, function (error, result) {
            if (!error) {
                resolve(result);
            } else {
                reject(error);
            }
        });
    });
};
export const decompress = (input: zlib.InputType, options?: zlib.ZlibOptions): Promise<Buffer> => {
    return new Promise(function (resolve, reject) {
        zlib.gunzip(input, options || {}, function (error, result) {
            if (!error) {
                resolve(result);
            } else {
                reject(error);
            }
        });
    });
};

/**
 * Compress a JS value: JSON-serializes it, then gzips the string. `zlib.gzip` only accepts
 * strings/buffers, so plain objects must be stringified first — this wrapper does that.
 */
export const compressJson = (value: unknown, options?: zlib.ZlibOptions): Promise<Buffer> => {
    return compress(JSON.stringify(value), options);
};

/**
 * Inverse of `compressJson`: gunzips then `JSON.parse`s. Pass a type argument for the
 * expected shape (unchecked at runtime).
 */
export const decompressJson = async <T = unknown>(
    input: zlib.InputType,
    options?: zlib.ZlibOptions
): Promise<T> => {
    const buffer = await decompress(input, options);
    return JSON.parse(buffer.toString());
};
