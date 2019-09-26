var mdb = require("mongodb");
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:8014";
const mdbid = require("mdbid");
const { get, set, unset } = require("lodash");

const createFile = data => {
    const newId = mdbid();
    return {
        ...data,
        deleted: false,
        _id: new mdb.ObjectID(newId),
        id: newId
    };
};

MongoClient.connect(url, async function(err, db) {
    if (err) throw err;
    var dbo = db.db("@webiny/js");
    const collection = await dbo.collection("PbPageElement");

    const isValidElement = element => {
        return element && element.type;
    };

    const getFileById = async id => {
        return await dbo.collection("File").findOne({ id });
    };

    const getFileBySrc = async src => {
        return await dbo.collection("File").findOne({ src });
    };

    const plugins = [
        {
            async setStorageValue(element) {
                const src = get(element, "data.settings.background.image.src");
                if (src) {
                    let file = await getFileBySrc(src);
                    if (!file) {
                        file = createFile({ src, name: null, type: null, size: null });
                        await dbo.collection("File").insertOne(file);
                    }
                    set(element, "data.settings.background.image.file", file.id);
                    unset(element, "data.settings.background.image.src");
                }
            }
        },
        {
            async setStorageValue(element) {
                if (element.type !== "image") {
                    return;
                }

                const src = get(element, "data.image.src");
                if (src) {
                    if (src.startsWith("data:")) {
                        return;
                    }

                    let file = await getFileBySrc(src);
                    if (!file) {
                        file = createFile({
                            src,
                            name: get(element, "data.image.name"),
                            type: get(element, "data.image.type"),
                            size: get(element, "data.image.size"),
                            meta: get(element, "data.image.meta") || {}
                        });
                        await dbo.collection("File").insertOne(file);
                    }
                    unset(element, "data.image.name");
                    unset(element, "data.image.type");
                    unset(element, "data.image.size");
                    unset(element, "data.image.src");
                    unset(element, "data.image.meta");
                    set(element, "data.image.file", file.id);
                }
            }
        }
    ];

    const asyncModifiers = async element => {
        if (!isValidElement(element)) {
            return;
        }

        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            await plugin.setStorageValue(element);
        }

        if (Array.isArray(element.elements)) {
            for (let i = 0; i < element.elements.length; i++) {
                await asyncModifiers(element.elements[i]);
            }
        }
    };

    const elements = await collection.find().toArray();

    try {
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            await asyncModifiers(element.content);
            collection.updateOne({ id: element.id }, { $set: { content: element.content } });
        }
        process.exit();
    } catch (e) {
        console.log(e);
    }
});
