import React, { useCallback, useEffect, useMemo } from "react";

import debounce from "lodash/debounce";
import { observer } from "mobx-react-lite";
import { useBind } from "@webiny/form";
import { entryRepositoryFactory } from "../domain";
import { AutoComplete } from "./AutoComplete";
import { RefPresenter } from "./RefPresenter";
import { ContentEntryListConfig } from "~/admin/config/contentEntries";
import { useApolloClient } from "~/admin/hooks";

export const Ref = observer(() => {
    const { useInputField } = ContentEntryListConfig.Browser.AdvancedSearch.FieldRenderer;
    const { name, field } = useInputField();
    const client = useApolloClient();

    const presenter = useMemo<RefPresenter>(() => {
        const repository = entryRepositoryFactory.getRepository(client, field.settings.modelIds);
        return new RefPresenter(repository);
    }, [client, field]);

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

    console.log("presenter.vm", presenter.vm);

    return <AutoComplete name={name} onInput={onInput} vm={presenter.vm} />;
});
