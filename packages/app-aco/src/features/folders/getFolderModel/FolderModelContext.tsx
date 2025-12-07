import { useContainer } from "@webiny/app";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { autorun, toJS } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { OverlayLoader } from "@webiny/admin-ui";
import { FolderModel } from "~/features/folders/abstractions.js";
import type { FolderModelDto } from "~/features/index.js";
import { GetFolderModelGqlGateway } from "~/features/folders/getFolderModel/GetFolderModelGqlGateway.js";
import { GetFolderModel } from "~/features/folders/getFolderModel/GetFolderModel.js";
import type { Decorator, GenericComponent } from "@webiny/app";
import { Plugin } from "@webiny/app";

export const FolderModelContext = React.createContext<FolderModelDto | undefined>(undefined);

const acoFolderModelProvider: Decorator<
    GenericComponent<{ children: React.ReactNode }>
> = Original => {
    return function AcoFolderProvider({ children }) {
        const client = useApolloClient();
        const container = useContainer();
        const gateway = new GetFolderModelGqlGateway(client);

        const [model, setModel] = useState<FolderModelDto | undefined>(undefined);

        const { useCase, repository } = useMemo(() => {
            return GetFolderModel.getInstance(gateway);
        }, [gateway]);

        const getFolderModel = useCallback(() => {
            return useCase.execute();
        }, [useCase]);

        useEffect(() => {
            if (model) {
                return;
            }

            getFolderModel();
        }, []);

        useEffect(() => {
            return autorun(() => {
                const model = repository.getModel();

                if (model) {
                    container.registerInstance(FolderModel, model);
                }

                setModel(state => {
                    if (model) {
                        return { ...toJS(model) };
                    }
                    return state;
                });
            });
        }, []);

        if (!model) {
            return <OverlayLoader text={"Preparing Folders..."} />;
        }

        return (
            <FolderModelContext.Provider value={model}>
                <Original>{children}</Original>
            </FolderModelContext.Provider>
        );
    };
};

export const FolderModelProviderModule = () => {
    return <Plugin providers={[acoFolderModelProvider]} />;
};
