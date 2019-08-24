const path = require("path");
const execa = require("execa");
const fs = require("fs-extra");
const rimraf = require("rimraf");
const { ObjectID } = require("mongodb");

module.exports = async (dbInstance, { dbName, host }) => {
    const out = path.join(__dirname, "out");
    rimraf.sync(path.join(out, dbName));

    await fs.ensureDir(out);

    const mongoDump = collection => [
        "mongoexport",
        [
            "--host",
            host,
            "--db",
            dbName,
            "--out",
            path.join(out, dbName, collection + ".json"),
            "--collection",
            collection
        ].filter(Boolean)
    ];

    const cmsCollections = ["CmsCategory", "CmsElement", "CmsMenu", "CmsPage"];

    const env = { LC_ALL: "C" };
    const opts = { stdio: "inherit", env };

    const renameMap = {
        CmsCategory: "PbCategory",
        CmsElement: "PbPageElement",
        CmsMenu: "PbMenu",
        CmsPage: "PbPage"
    };

    try {
        for (let i = 0; i < cmsCollections.length; i++) {
            const cmsCollection = cmsCollections[i];
            await execa(...mongoDump(cmsCollection), { stdio: "inherit" });
        }

        // Replace data
        for (let i = 0; i < cmsCollections.length; i++) {
            const cmsCollection = cmsCollections[i];

            // Replace `cms-` prefix
            await execa(
                "sed",
                ["-i.bak", '-es/"cms-/"pb-/g', `./out/${dbName}/${cmsCollection}.json`],
                opts
            );

            // Replace `pb-element-` prefix
            await execa(
                "sed",
                ["-i.bak", '-es/"pb-element-/"/g', `./out/${dbName}/${cmsCollection}.json`],
                opts
            );

            await execa(
                "sed",
                ["-i.bak", '-es/"pages-list-component-/"/g', `./out/${dbName}/${cmsCollection}.json`],
                opts
            );

            // Replace `--webiny-cms` prefix for CSS vars
            await execa(
                "sed",
                [
                    "-i.bak",
                    "-es/--webiny-cms/--webiny-pb/g",
                    `./out/${dbName}/${cmsCollection}.json`
                ],
                opts
            );

            if (cmsCollection === "CmsElement") {
                // replace `pb-block-category-` prefix with an empty string
                await execa(
                    "sed",
                    [
                        "-i.bak",
                        '-es/"pb-block-category-/"/g',
                        `./out/${dbName}/${cmsCollection}.json`
                    ],
                    opts
                );
            }

            if (cmsCollection === "CmsMenu") {
                // replace `pb-menu-item-` prefix with an empty string
                await execa(
                    "sed",
                    ["-i.bak", '-es/"pb-menu-item-/"/g', `./out/${dbName}/${cmsCollection}.json`],
                    opts
                );
            }

            // Restore
            await execa(
                "mongoimport",
                [
                    "--host",
                    host,
                    "--db",
                    dbName,
                    "--drop",
                    "--collection",
                    renameMap[cmsCollection],
                    "--file",
                    path.join(out, dbName, `${cmsCollection}.json`)
                ].filter(Boolean),
                opts
            );
        }

        // Copy settings record
        const data = await dbInstance.collection("Settings").findOne({ key: "cms" });
        if (!data) {
            return;
        }

        const newId = new ObjectID();
        data.key = "page-builder";
        data._id = newId;
        data.id = newId.toString();
        await dbInstance.collection("Settings").insertOne(data);
    } catch (err) {
        console.log(err);
    }
};
