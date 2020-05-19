export const createRevisionIndexes = async ({ model, entry, context, autoDelete = true }) => {
    const locales = context.i18n.getLocales();
    const environment = context.cms.getEnvironment();
    const driver = model.getStorageDriver();

    // Delete all existing indexes for this revision
    if (autoDelete !== false) {
        await driver.delete({
            name: "CmsContentEntrySearch",
            options: {
                query: {
                    environment: environment.id,
                    model: model.modelId,
                    revision: entry.id
                }
            }
        });
    }

    // Create indexes for this particular entry
    const createIndexes = [];

    const empty = [null, undefined];

    for (let x = 0; x < locales.length; x++) {
        const locale = locales[x];

        for (let y = 0; y < model.indexes.length; y++) {
            const { fields } = model.indexes[y];

            const indexValues = {};
            for (let f = 0; f < fields.length; f++) {
                let value;
                if (fields[f] === "id") {
                    value = entry.id;
                } else {
                    const i18nValue = entry.fields[fields[f]].values.find(
                        item => item.locale === locale.id
                    );
                    value = i18nValue ? i18nValue.value : undefined;
                }

                indexValues[`v${f}`] = value;
            }

            // Skip index entry if one of the index values is `null`.
            if (Object.values(indexValues).some(v => empty.includes(v))) {
                continue;
            }

            const entryValues: any = {
                id: model.generateId(),
                environment: environment.id,
                model: model.modelId,
                locale: locale.id,
                revision: entry.id,
                latestVersion: entry.latestVersion,
                published: entry.published,
                fields: fields.join(","),
                ...indexValues
            };

            createIndexes.push({ name: "CmsContentEntrySearch", data: entryValues });
        }
    }

    // Insert new entry indexes
    await driver.create(createIndexes);
};
