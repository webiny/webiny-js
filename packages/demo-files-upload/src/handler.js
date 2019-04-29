import fs from "fs-extra";
import Busboy from "busboy";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: __dirname + "/../.env" });

const UPLOADS_FOLDER = process.env.UPLOADS_FOLDER || "static";

const save = req => {
    return new Promise(resolve => {
        const busboy = new Busboy({ headers: req.headers });

        let key = "";
        busboy.on("field", function(fieldname, value) {
            if (fieldname === "key") {
                key = value;
            }
        });

        busboy.on("file", function(name, file) {
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

export const handler = async (event: Object, { req }) => {
    await save(req);

    return {
        statusCode: 204,
        headers: {
            "Access-Control-Allow-Origin": "*"
        }
    };
};
