import fs from "fs-extra";
import Busboy from "busboy";
import path from "path";

const UPLOADS_FOLDER = process.env.UPLOADS_FOLDER || "static";

const save = ({ headers }, req) => {
    return new Promise(resolve => {
        const busboy = new Busboy({ headers });

        let key = "";
        busboy.on("field", (fieldName, value) => {
            if (fieldName === "key") {
                key = value;
            }
        });

        busboy.on("file", (name, file) => {
            const folder = path.resolve(UPLOADS_FOLDER);
            if (fs.existsSync(folder) === false) {
                fs.mkdirSync(folder);
            }

            const writerStream = fs.createWriteStream(path.join(folder, "/", key), {
                encoding: "utf8"
            });
            file.pipe(writerStream);
        });
        busboy.on("finish", resolve);
        req.pipe(busboy);
    });
};

export const handler = async (event, { req }) => {
    await save(event, req);

    return {
        statusCode: 204,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
};
