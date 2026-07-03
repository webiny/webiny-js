import { useMemo } from "react";
import { useContainer } from "@webiny/app";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { filterRepositoryFactory } from "~/components/AdvancedSearch/domain/index.js";

export const useFilterRepository = (namespace: string) => {
    const container = useContainer();
    const client = useMemo(() => container.resolve(MainGraphQLClient), [container]);

    return filterRepositoryFactory.getRepository(client, namespace);
};
