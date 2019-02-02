// @flowIgnore
import config from "../../src/configs";
import fs from "fs-extra";
import { camelCase } from "lodash";

const pwd: string = (process.cwd(): any);

const copyImage = (srcFilename, targetFilename = null) => {
    const src = `${pwd}/static/${srcFilename}`;
    const dest = `${pwd}/../webiny-api-cms/src/install/plugins/importData/blocks/images/${targetFilename ||
        srcFilename}`;
    console.log(`> ${srcFilename} ---> ${dest}`);
    fs.copySync(src, dest);
};

const writeDataToFile = (filename, data) => {
    const dest = `${pwd}/../webiny-api-cms/src/install/plugins/importData/blocks/${filename.toLowerCase()}.js`;

    fs.writeFileSync(dest, `export default ${JSON.stringify(data)}`);
};

const writeIndexFile = content => {
    const dest = `${pwd}/../webiny-api-cms/src/install/plugins/importData/blocks/index.js`;

    fs.writeFileSync(dest, content);
};

export default async () => {
    fs.emptyDirSync(`${pwd}/../webiny-api-cms/src/install/plugins/importData/blocks`);
    const { database } = await config();
    
    const blocks = await database.mongodb.collection("CmsElement").find({ deleted: false, type: "block" }).toArray();

    const files = [];

    await Promise.all(
        blocks.map(async data => {
            // Copy images.
            const regex = /\/files\/(.*?)"/gm;
            const str = data.content;
            let m;

            console.log(`===========================\n> Block: ${data.name}`);
            while ((m = regex.exec(str)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }

                const filename = m[1];

                console.log(`> Copy image: ${filename}`);
                copyImage(filename);
            }

            console.log(`> Copy preview: ${data.preview.src}`);
            const previewName = data.preview.src.match(/\/files\/(.*)/)[1];
            let targetName = previewName;
            if (!targetName.startsWith("cms-element-")) {
                targetName = `cms-element-${data.id}_${previewName}`;
                data.preview.name = targetName;
                data.preview.src = data.preview.src.replace(previewName, targetName);
            }
            copyImage(previewName, targetName);

            const filename = camelCase(data.name);
            writeDataToFile(filename, data);

            files.push(filename);
        })
    );

    // Generate code to include blocks in the installation process
    const index = [
        "// @flowIgnore",
        "// NOTE: THIS FILE IS AUTO-GENERATED. MANUAL CHANGES OF THIS FILE WILL BE LOST!\n",
        ...files.map(filename => `import ${filename} from "./${filename}";`),
        "",
        `export default [${files.join(", ")}];`
    ].join("\n");

    console.log("\n> Writing index file...");
    writeIndexFile(index);

    console.log(`\nDone! Successfully exported ${files.length} blocks!`);
};
