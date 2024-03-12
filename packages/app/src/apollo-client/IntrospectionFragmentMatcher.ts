import { IdValue } from "apollo-utilities";
import { invariant } from "ts-invariant";

import {
    ReadStoreContext,
    FragmentMatcherInterface,
    PossibleTypesMap,
    IntrospectionResultData
} from "apollo-cache-inmemory";

export class IntrospectionFragmentMatcher implements FragmentMatcherInterface {
    private readonly isReady: boolean;
    private readonly possibleTypesMap: PossibleTypesMap = {};

    constructor(options?: { introspectionQueryResultData?: IntrospectionResultData }) {
        if (options && options.introspectionQueryResultData) {
            this.possibleTypesMap = this.parseIntrospectionResult(
                options.introspectionQueryResultData
            );
            this.isReady = true;
        } else {
            this.isReady = false;
        }

        this.match = this.match.bind(this);
    }

    public match(idValue: IdValue, typeCondition: string, context: ReadStoreContext) {
        invariant(this.isReady, "FragmentMatcher.match() was called before FragmentMatcher.init()");

        const obj = context.store.get(idValue.id);
        const isRootQuery = idValue.id === "ROOT_QUERY";

        if (!obj) {
            // https://github.com/apollographql/apollo-client/pull/4620
            return isRootQuery;
        }

        const { __typename = isRootQuery && "Query" } = obj;

        invariant(
            __typename,
            `Cannot match fragment because __typename property is missing: ${JSON.stringify(obj)}`
        );

        if (__typename === typeCondition) {
            return true;
        }

        const implementingTypes = this.possibleTypesMap[typeCondition];
        if (__typename && implementingTypes && implementingTypes.indexOf(__typename) > -1) {
            return true;
        }

        return false;
    }

    private parseIntrospectionResult(
        introspectionResultData: IntrospectionResultData
    ): PossibleTypesMap {
        const typeMap: PossibleTypesMap = {};
        introspectionResultData.__schema.types.forEach(type => {
            if (type.kind === "UNION" || type.kind === "INTERFACE") {
                typeMap[type.name] = type.possibleTypes.map(
                    implementingType => implementingType.name
                );
            }
        });
        return typeMap;
    }
}
