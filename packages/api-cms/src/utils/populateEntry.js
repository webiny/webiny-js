export default async function populateEntry(entry, args, { model }) {
    for (let i = 0; i < model.fields.length; i++) {
        const { fieldId } = model.fields[i];

        if (typeof args[fieldId] === "undefined") {
            continue;
        }

        entry[fieldId] = args[fieldId];
    }
}
