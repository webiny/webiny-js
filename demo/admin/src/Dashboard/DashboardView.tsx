import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { MainContainer, Wrapper } from "./Components/styled";
import { Header } from "./Components/Header";
import { DashboardPresenter } from "./DashboardPresenter";
import { Table } from "@webiny/app-aco";
import { ReadonlyArticle } from "@demo/shared";
import debounce from "lodash/debounce";

interface DashboardViewProps {
    presenter: DashboardPresenter;
}

export const DashboardView = observer(({ presenter }: DashboardViewProps) => {
    const [search, setSearch] = useState("");
    useEffect(() => {
        presenter.init();
    }, []);

    const vm = presenter.vm;

    const applySearch = useMemo(() => {
        return debounce(presenter.setSearch, 200);
    }, [presenter]);

    const setSearchQuery = useCallback(query => {
        setSearch(query);
        applySearch(query);
    }, []);

    return (
        <>
            <MainContainer>
                <Header title={"Articles"} searchValue={search} onSearchChange={setSearchQuery} />
                <Wrapper>
                    <Table<ReadonlyArticle>
                        data={vm.articles || []}
                        nameColumnId={"title"}
                        namespace={`cms.article`}
                        loading={vm.isListLoading}
                        onSortingChange={() => void 0}
                        sorting={[]}
                        selected={[]}
                    />
                </Wrapper>
            </MainContainer>
        </>
    );
});
