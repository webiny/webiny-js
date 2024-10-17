import { autorun } from "mobx";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { TranslatedCollection } from "~/translations/translatedCollection/TranslatedCollection";
import { translatedCollectionCache } from "~/translations/translatedCollection/translatedCollectionCache";
import { ISaveTranslatedCollectionGateway } from "~/translations/translatedCollection/saveTranslatedCollection/ISaveTranslatedCollectionGateway";
import { ISaveTranslatedCollectionRepository } from "~/translations/translatedCollection/saveTranslatedCollection/ISaveTranslatedCollectionRepository";
import { SaveTranslatedCollectionGqlGateway } from "~/translations/translatedCollection/saveTranslatedCollection/SaveTranslatedCollectionGqlGateway";
import { SaveTranslatedCollectionRepository } from "~/translations/translatedCollection/saveTranslatedCollection/SaveTranslatedCollectionRepository";

export const useSaveTranslatedCollection = () => {
    const client = useApolloClient();
    const [loading, setLoading] = useState(false);

    const gateway = useMemo<ISaveTranslatedCollectionGateway>(() => {
        return new SaveTranslatedCollectionGqlGateway(client);
    }, [client]);

    const repository = useMemo<ISaveTranslatedCollectionRepository>(() => {
        return new SaveTranslatedCollectionRepository(gateway, translatedCollectionCache);
    }, [gateway]);

    const saveTranslatedCollection = useCallback(
        (translatedCollection: TranslatedCollection) => {
            return repository.execute(translatedCollection);
        },
        [repository]
    );

    useEffect(() => {
        autorun(() => {
            const loading = repository.getLoading();
            setLoading(loading);
        });
    }, [repository]);

    return { loading, saveTranslatedCollection };
};
