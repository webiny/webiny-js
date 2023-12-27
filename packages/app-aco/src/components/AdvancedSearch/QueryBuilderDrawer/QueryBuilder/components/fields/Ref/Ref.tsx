import React, { useCallback, useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import { observer } from "mobx-react-lite";
import { config as appConfig } from "@webiny/app/config";
import { createApolloClient } from "@webiny/app-serverless-cms";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";
import { useBind } from "@webiny/form";
import { AutoComplete } from "./AutoComplete";
import { RefPresenter } from "./RefPresenter";
import { entryRepositoryFactory } from "./domain";

export interface RefProps {
    name: string;
    modelId: string;
}

export const Ref = observer(({ name, modelId }: RefProps) => {
    const apiUrl = appConfig.getKey("API_URL", process.env.REACT_APP_API_URL);
    const { getCurrentLocale } = useI18N();
    const currentLocale = getCurrentLocale();

    const presenter = useMemo<RefPresenter>(() => {
        const client = createApolloClient({ uri: `${apiUrl}/cms/manage/${currentLocale}` });
        const repository = entryRepositoryFactory.getRepository(client, modelId);
        return new RefPresenter(repository);
    }, [modelId, apiUrl, currentLocale]);

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
