import { useFeature } from "@webiny/app";
import { FilterRepositoryFeature } from "~/features/filterRepository/index.js";

export const useFilterRepository = (namespace: string) => {
    const { factory } = useFeature(FilterRepositoryFeature);

    return factory.getRepository(namespace);
};
