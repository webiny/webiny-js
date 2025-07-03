import { useCallback, useEffect, useMemo, useState } from "react";
import { autorun } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { useGetPageGraphQLSelection } from "~/features/pages/index.js";
import { type PageDto, PageDtoMapper } from "~/features/pages/listPages/PageDto.js";
import { ListPagesGqlGateway } from "~/features/pages/listPages/ListPagesGqlGateway.js";
import { ListPages } from "~/features/pages/listPages/ListPages.js";
import type { ListPagesUseCaseParams } from "~/features/pages/listPages/IListPagesUseCase.js";

export const useListPages = () => {
    const client = useApolloClient();
    const fields = useGetPageGraphQLSelection();
    const gateway = new ListPagesGqlGateway(client, fields);

    const [vm, setVm] = useState<{
        pages: PageDto[];
        loading: Record<string, boolean>;
    }>({
        pages: [],
        loading: {
            INIT: true
        }
    });

    const {
        useCase,
        pages: pagesCache,
        loading
    } = useMemo(() => {
        return ListPages.getInstance(gateway);
    }, [gateway]);

    const listPages = useCallback(
        (params: ListPagesUseCaseParams) => {
            return useCase.execute(params);
        },
        [useCase]
    );

    useEffect(() => {
        return autorun(() => {
            const pages = pagesCache.getItems().map(page => PageDtoMapper.toDTO(page));

            setVm(vm => ({
                ...vm,
                pages
            }));
        });
    }, [pagesCache]);

    useEffect(() => {
        return autorun(() => {
            const loadingState = loading.get();

            setVm(vm => ({
                ...vm,
                loading: loadingState
            }));
        });
    }, [loading]);

    return {
        ...vm,
        listPages
    };
};
