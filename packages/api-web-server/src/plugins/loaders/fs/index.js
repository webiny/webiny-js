import path from "path";
import fs from "fs";

export default () => ({
    type: "handler-files-loader",
    name: "handler-files-loader-fs",
    async load(pathToResolve) {
        const pathToRead = path.resolve(pathToResolve);
        return new Promise((resolve, reject) => {
            fs.readFile(pathToRead, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });
    }
});
