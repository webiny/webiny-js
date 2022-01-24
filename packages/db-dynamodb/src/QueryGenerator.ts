import createKeyConditionExpressionArgs from "./statements/createKeyConditionExpressionArgs";
import { Query, QueryKey, QueryKeyField, QueryKeys, QuerySort } from "~/types";

interface GenerateParams {
    query: Query;
    keys: QueryKeys;
    sort: QuerySort;
    limit: number;
    tableName: string;
}
class QueryGenerator {
    generate(params: GenerateParams) {
        const { query, keys, sort, limit, tableName } = params;
        // 1. Which key can we use in this query operation?
        const key = this.findQueryKey(query, keys);

        if (!key) {
            throw new Error("Cannot perform query - key not found.");
        }

        // 2. Now that we know the key, let's separate the key attributes from the rest.
        const keyAttributesValues: Record<string, string> = {};
        const nonKeyAttributesValues: Record<string, string> = {};
        for (const queryKey in query) {
            if (key.fields.find((item: QueryKeyField) => item.name === queryKey)) {
                keyAttributesValues[queryKey] = query[queryKey];
            } else {
                nonKeyAttributesValues[queryKey] = query[queryKey];
            }
        }

        const keyConditionExpression = createKeyConditionExpressionArgs({
            query: keyAttributesValues,
            sort,
            key
        });

        return { ...keyConditionExpression, TableName: tableName, Limit: limit };
    }

    findQueryKey(query: Query = {}, keys: QueryKeys = []): QueryKey | null {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            let hasAllFields = true;
            for (let j = 0; j < key.fields.length; j++) {
                const field = key.fields[j];
                if (!query[field.name]) {
                    hasAllFields = false;
                    break;
                }
            }

            if (hasAllFields) {
                return key;
            }
        }
        return null;
    }
}

export default QueryGenerator;
