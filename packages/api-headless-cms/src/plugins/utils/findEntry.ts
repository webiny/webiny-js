import createFindSorters from "./createFindSorters";
import createFindQuery from "./createFindQuery";
import parseBoolean from "./parseBoolean";

export default async function findEntry({ model, args, context }) {
    // Create a shallow copy of context and override the `locale` value
    const localContext = { ...context };
    if (args.locale) {
        localContext.locale = args.locale;
    }

    parseBoolean(args);
    let { where, sort } = args;

    const match = createFindQuery(model, where, localContext);
    const sorters = createFindSorters(model, sort);

    const [entry] = await collection
        .find(match)
        .sort(sorters)
        .limit(1)
        .toArray();

    return entry;
}
