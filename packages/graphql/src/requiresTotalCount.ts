import { GraphQLResolveInfo } from "graphql";

export default (info: GraphQLResolveInfo): boolean => {
    const meta = info.fieldNodes[0].selectionSet.selections.find(
        // @ts-ignore
        field => field.name.value === "meta"
    );

    if (meta) {
        // @ts-ignore
        const totalCount = meta.selectionSet.selections.find(
            field => field.name.value === "totalCount"
        );

        if (totalCount) {
            return true;
        }
    }

    return false;
};
