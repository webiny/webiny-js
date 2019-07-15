/* eslint-disable */
// @flowIgnore
import config from "../../src/configs";
import fs from "fs-extra";
import { green } from "chalk";
import { omit } from "lodash";
import inquirer from "inquirer";

const pwd: string = (process.cwd(): any);

const copyImage = (srcFilename, targetFilename = null) => {
    const src = `${pwd}/../../.files/${srcFilename}`;
    const dest = `${pwd}/../webiny-api-cms/src/install/plugins/importData/pages/images/${targetFilename ||
        srcFilename}`;

    const blockImage = dest.replace("/pages/", "/blocks/");
    if (!fs.existsSync(blockImage)) {
        console.log(`${green("> Copy image:")} ${srcFilename}`);
        fs.copySync(src, dest);
    }
};

const writeIndexFile = content => {
    const dest = `${pwd}/../webiny-api-cms/src/install/plugins/importData/pages/index.js`;

    fs.writeFileSync(dest, content);
};

const omitPageAttributes = obj => {
    return omit(obj, [
        "savedOn",
        "createdOn",
        "updatedOn",
        "published",
        "publishedOn",
        "createdBy",
        "updatedBy",
        "deleted",
        "parent"
    ]);
};

export default async () => {
    fs.emptyDirSync(`${pwd}/../webiny-api-cms/src/install/plugins/importData/pages`);
    const { database } = await config();

    let pages = await database.mongodb
        .collection("CmsPage")
        .find({ deleted: false, published: true })
        .toArray();

    // Get pages to export
    const answers = await inquirer.prompt([
        {
            type: "checkbox",
            name: "pages",
            message: "Select pages to export",
            choices: pages.map(p => ({ value: p.id, name: p.title })),
            default: pages.map(p => p.id)
        }
    ]);

    // Filter pages
    pages = pages.filter(p => answers.pages.includes(p.id)).map(omitPageAttributes);

    // Get categories
    const categories = (await database.mongodb
        .collection("CmsCategory")
        .find()
        .toArray()).map(omitPageAttributes);

    // Get menus
    const menus = (await database.mongodb
        .collection("CmsMenu")
        .find()
        .toArray()).map(omitPageAttributes);

    const exportedFiles = [];

    // Copy page files
    for (let i = 0; i < pages.length; i++) {
        const data = pages[i];
        const regex = /(image|file)":"([a-f0-9]{24})"/gm;
        const str = JSON.stringify(data);
        let m;

        console.log(`===========================\n> Page: ${data.title}`);
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            if (Array.isArray(m)) {
                const [, , id] = m;
                if (exportedFiles.find(item => item.id === id)) {
                    continue;
                }
                const file = await database.mongodb.collection("File").findOne({ id });
                if (!file.meta) {
                    file.meta = {};
                }
                file.meta.private = true;

                file.name = file.src.match(/\/files\/(.*)/);
                file.name = file.name[1];

                exportedFiles.push(file);
                copyImage(file.name);
            }
        }

        // Copy page image from settings
        if (data.settings.general.image && data.settings.general.image.src) {
            const pageImage = data.settings.general.image.src.replace("/files/", "");
            copyImage(pageImage);
        }

        // Copy social image from settings
        if (data.settings.social.image && data.settings.social.image.src) {
            const socialImage = data.settings.social.image.src.replace("/files/", "");
            copyImage(socialImage);
        }
    }

    // Generate code to include pages in the installation process
    const index = [
        "// NOTE: THIS FILE IS AUTO-GENERATED. MANUAL CHANGES OF THIS FILE WILL BE LOST!\n",
        "",
        `export const categories = [${categories.map(c => JSON.stringify(c)).join(", ")}];`,
        `export const pages = [${pages.map(p => JSON.stringify(p)).join(", ")}];`,
        `export const files = [${exportedFiles.map(f => JSON.stringify(f)).join(", ")}];`,
        `export const menus = [${menus.map(m => JSON.stringify(m)).join(", ")}];`
    ].join("\n");

    console.log("\n> Writing index file...");
    writeIndexFile(index);

    console.log(`\nDone!`);
};
