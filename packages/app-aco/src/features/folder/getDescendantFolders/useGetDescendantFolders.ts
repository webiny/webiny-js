import { useCallback, useMemo } from "react";
import { FoldersCache } from "../cache";
import { GetDescendantFoldersRepository } from "./GetDescendantFoldersRepository";
import { GetDescendantFoldersUseCase } from "./GetDescendantFoldersUseCase";

export const useGetDescendantFolders = (cache: FoldersCache) => {
    const repository = useMemo(() => {
        return new GetDescendantFoldersRepository(cache);
    }, [cache]);

    const useCase = useMemo(() => {
        return new GetDescendantFoldersUseCase(repository);
    }, [repository]);

    const getDescendantFolders = useCallback(
        (id: string) => {
            return useCase.execute({ id });
        },
        [useCase]
    );

    return {
        getDescendantFolders
    };
};
