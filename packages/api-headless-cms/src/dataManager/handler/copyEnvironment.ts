export const copyEnvironment = async ({ context, copyFrom, copyTo }) => {
    const { driver } = context.commodo;

    // Copy all environment indexes
    await copyData({
        driver,
        name: "CmsContentEntrySearch",
        query: {
            environment: copyFrom
        },
        environment: copyTo
    });

    // Copy all environment data entries
    await copyData({
        driver,
        name: "CmsContentEntry",
        query: {
            environment: copyFrom,
            deleted: { $ne: true }
        },
        environment: copyTo
    });

    // Copy all environment content models
    await copyData({
        driver,
        name: "CmsContentModel",
        query: {
            environment: copyFrom,
            deleted: { $ne: true }
        },
        environment: copyTo
    });

    // Copy all environment content models
    await copyData({
        driver,
        name: "CmsContentModelGroup",
        query: {
            environment: copyFrom,
            deleted: { $ne: true }
        },
        environment: copyTo
    });

    return true;
};

const copyData = async ({ driver, name, query, environment }) => {
    let nextPage = null;
    while (true) {
        const { entries, cursor } = await paginateRecords({
            driver,
            name,
            cursor: nextPage,
            query
        });

        const newEntries = entries.map(entry => {
            delete entry._id;
            entry.environment = environment;
            return { name, data: entry };
        });

        await driver.create(newEntries);

        if (!cursor) {
            break;
        }

        nextPage = cursor;
    }
};

const paginateRecords = async ({ driver, name, cursor, query }) => {
    if (cursor) {
        query.id = { $lt: cursor };
    }

    // We set `limit` to 101 to know if there is more data to fetch
    const [entries] = await driver.find({
        name,
        options: { limit: 101, query, sort: { id: -1 } }
    });

    const hasMore = entries.length > 100;

    if (hasMore) {
        // Remove the 101st item from results
        entries.pop();
    }

    return { entries, cursor: hasMore ? entries[entries.length - 1].id : null };
};
