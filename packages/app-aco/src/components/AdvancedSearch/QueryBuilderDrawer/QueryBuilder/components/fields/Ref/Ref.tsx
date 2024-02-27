import React, { useCallback, useEffect, useMemo } from "react";
import { ApolloClient } from "apollo-client";
import debounce from "lodash/debounce";
import { observer } from "mobx-react-lite";
import { useBind } from "@webiny/form";
import { AutoComplete } from "./AutoComplete";
import { RefPresenter } from "./RefPresenter";
import { entryRepositoryFactory } from "./domain";

export interface RefProps {
    name: string;
    modelIds: string[];
    client: ApolloClient<any>;
}

export const Ref = observer(({ name, modelIds, client }: RefProps) => {
    const presenter = useMemo<RefPresenter>(() => {
        const repository = entryRepositoryFactory.getRepository(client, modelIds);
        return new RefPresenter(repository);
    }, [client, modelIds]);

    const { value } = useBind({
        name
    });

    useEffect(() => {
        presenter.load(value);
    }, []);

    const onInput = useCallback(
        debounce(value => presenter.search(value), 250),
        [presenter.search]
    );

    return <AutoComplete name={name} onInput={onInput} vm={presenter.vm} />;
});
