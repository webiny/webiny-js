// @flow
import fs from "fs-extra";
import Busboy from "busboy";

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
            const folder = `${process.cwd()}/packages/demo-api/static/`;
            if (fs.existsSync(folder) === false) {
                fs.mkdirSync(folder);
            }

            const writerStream = fs.createWriteStream(folder + key, { encoding: "utf8" });
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
