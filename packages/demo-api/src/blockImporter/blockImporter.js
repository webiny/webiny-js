// @flow
import config from "./../configs";
import fs from "fs-extra";
import slugify from "slugify";

const pwd: string = (process.env.PWD: any);

const copyImage = async filename => {
    const src = `${pwd}/static/${filename}`;
    const dest = `${pwd}/../webiny-api-cms/src/install/plugins/importData/blocks/images/${filename}`;
    await fs.copy(src, dest);
};

const writeDataToFile = async data => {
    const fs = require("fs");
    const filename = slugify(data.name);
    const dest = `${pwd}/../webiny-api-cms/src/install/plugins/importData/blocks/${filename.toLowerCase()}.js`;

    await fs.writeFileSync(dest, `export default ${JSON.stringify(data)}`);
};

export default async (ids: Array<string>) => {
    for (let i = 0; i < ids.length; i++) {
        const [data] = await config.database.connection.query(
            "SELECT name, type, content, preview, category FROM Cms_Elements WHERE id = ?",
            [ids[i]]
        );

        if (!data) {
            throw Error(`Element with ID ${ids[i]} not found.`);
        }

        // Copy images.
        const regex = /http:\/\/localhost.*\/files\/(.*?)"/gm;
        const str = data.content;
        let m;

        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            const filename = m[1];

            await copyImage(filename);
        }

        data.preview = JSON.parse(data.preview);
        await copyImage(data.preview.src.match(/\/files\/(.*)/)[1]);

        data.content = JSON.parse(data.content);
        await writeDataToFile(data);
    }
};
