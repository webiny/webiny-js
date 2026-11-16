import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";

/**
 * The files are `.cjs` and `.mjs` here so the package build copies them as they are instead of
 * compiling them. In the zip they get the names the forwarders load each other by: `handler.js`
 * (the regular Lambda's `handler.handler`) and `index.mjs` both load `./mqtt.js`.
 */
const readFile = (name: string) => {
    return fs.readFileSync(path.join(import.meta.dirname, name));
};

/**
 * The forwarder a regular Lambda function runs while `webiny watch` is on.
 */
export function createLambdaForwarderZip(): Buffer {
    const zip = new AdmZip();
    zip.addFile("handler.js", readFile("lambdaHandler.cjs"));
    zip.addFile("mqtt.js", readFile("mqtt.cjs"));
    return zip.toBuffer();
}

/**
 * The forwarder the API's Lambda web function runs while `webiny watch` is on.
 */
export function createWebForwarderZip(): Buffer {
    const zip = new AdmZip();
    zip.addFile("index.mjs", readFile("webHandler.mjs"));
    zip.addFile("mqtt.js", readFile("mqtt.cjs"));
    return zip.toBuffer();
}
