import { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { TranslatableCollection } from "~/translations/translatableCollection/TranslatableCollection";
import { SaveTranslatableCollectionGqlGateway } from "~/translations/translatableCollection/saveTranslatableCollection/SaveTranslatableCollectionGqlGateway";
import { SaveTranslatableCollectionRepository } from "~/translations/translatableCollection/saveTranslatableCollection/SaveTranslatableCollectionRepository";
import { translatedCollectionCache } from "~/translations/translatedCollection/translatedCollectionCache";

export const useSaveTranslatableCollection = () => {
    const client = useApolloClient();

    const gateway = useMemo(() => {
        return new SaveTranslatableCollectionGqlGateway(client);
    }, [client]);

    const repository = useMemo(() => {
        return new SaveTranslatableCollectionRepository(gateway, translatedCollectionCache);
    }, [gateway]);

    const saveTranslatableCollection = useCallback(
        (translatableCollection: TranslatableCollection) => {
            return repository.execute(translatableCollection);
        },
        [repository]
    );

    return { saveTranslatableCollection };
};
