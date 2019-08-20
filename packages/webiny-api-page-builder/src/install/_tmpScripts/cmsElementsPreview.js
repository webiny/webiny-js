var mdb = require("mongodb");
var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:8014";
const mdbid = require("mdbid");

MongoClient.connect(url, async function(err, db) {
    if (err) throw err;
    var dbo = db.db("webiny-js");
    const elements = await dbo
        .collection("PbPageElement")
        .find()
        .toArray();

    try {
        for (let i = 0; i < elements.length; i++) {
            let element = elements[i];
            if (typeof element.preview === "string") {
                continue;
            }

            let file = await dbo.collection("File").findOne({ src: element.preview.src });
            if (!file) {
                const newId = mdbid();
                file = {
                    deleted: false,
                    _id: new mdb.ObjectID(newId),
                    id: newId,
                    name: element.preview.name,
                    size: element.preview.size,
                    type: element.preview.type,
                    src: element.preview.src,
                    meta: element.preview.meta || {}
                };
                await dbo.collection("File").insert(file);
            }

            await dbo
                .collection("PbPageElement")
                .updateOne({ id: element.id }, { $set: { preview: file.id } });
        }
        process.exit();
    } catch (e) {
        console.log(e);
    }
});
