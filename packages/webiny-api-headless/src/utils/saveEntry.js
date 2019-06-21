import { ObjectId } from "mongodb";
import { getPlugins } from "webiny-plugins";
import createCollectionName from "webiny-api-headless/utils/createCollectionName";

function createDbData({ context }) {
    const dbData = {
        data: {},
        beforeSave: [],
        afterSave: []
    };

    return {
        get(key) {
            return dbData.data[key];
        },
        set(key, value) {
            dbData.data[key] = value;
        },
        beforeSave(fn) {
            dbData.beforeSave.push(fn);
        },
        afterSave(fn) {
            dbData.afterSave.push(fn);
        },
        async save() {
            for (let i = 0; i < dbData.beforeSave.length; i++) {
                const fn = dbData.beforeSave[i];
                await fn();
            }

            await context
                .getDatabase()
                .collection(createCollectionName(model.modelId))
                .updateOne({ _id: dbData.data._id }, { $set: dbData.data }, { upsert: true });

            for (let i = 0; i < dbData.afterSave.length; i++) {
                const fn = dbData.afterSave[i];
                await fn();
            }
        }
    };
}

export default async function saveEntry(entry, { models, model, context }) {
    const fieldPlugins = getPlugins("cms-headless-field-type").reduce((acc, pl) => {
        acc[pl.fieldType] = pl;
        return acc;
    }, {});

    const dbData = createDbData({ context });

    for (let i = 0; i < model.fields.length; i++) {
        const field = model.fields[i];
        const { fieldId, type } = field;

        const { manage } = fieldPlugins[type];
        if (typeof manage.saveValue === "function") {
            await manage.saveValue(entry, dbData, {
                models,
                model,
                context,
                field
            });
            continue;
        }

        //  Fallback - set value as is.
        dbData.set(fieldId, entry[fieldId]);
    }

    // Save to DB.
    dbData.set("_id", entry._id ? entry._id : new ObjectId());

    await dbData.save();

    return dbData.get("_id");
}
