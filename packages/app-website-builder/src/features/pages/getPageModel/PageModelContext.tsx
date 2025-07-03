import React, { useState, useCallback, useMemo, useEffect } from "react";
import { autorun, toJS } from "mobx";
import { useApolloClient } from "@apollo/react-hooks";
import { OverlayLoader } from "@webiny/admin-ui";
import { Decorator, GenericComponent, Plugin } from "@webiny/app";
import { GetPageModelGqlGateway } from "~/features/pages/getPageModel/GetPageModelGqlGateway.js";
import type { PageModelDto } from "~/features/pages/getPageModel/PageModelDto.js";
import { GetPageModel } from "~/features/pages/getPageModel/GetPageModel.js";

export const PageModelContext = React.createContext<PageModelDto | undefined>(undefined);

const wbPageModelProvider: Decorator<
    GenericComponent<{ children: React.ReactNode }>
> = Original => {
    return function WbPageProvider({ children }) {
        const client = useApolloClient();
        const gateway = new GetPageModelGqlGateway(client);

        const [model, setModel] = useState<PageModelDto | undefined>(undefined);

        const { useCase, repository } = useMemo(() => {
            return GetPageModel.getInstance(gateway);
        }, [gateway]);

        const getPageModel = useCallback(() => {
            return useCase.execute();
        }, [useCase]);

        useEffect(() => {
            if (model) {
                return;
            }

            getPageModel();
        }, []);

        useEffect(() => {
            return autorun(() => {
                const model = repository.getModel();
                setModel(state => {
                    if (model) {
                        return { ...toJS(model) };
                    }
                    return state;
                });
            });
        }, []);

        if (!model) {
            return <OverlayLoader text={"Preparing pages..."} />;
        }

        return (
            <PageModelContext.Provider value={model}>
                <Original>{children}</Original>
            </PageModelContext.Provider>
        );
    };
};

export const PageModelProviderModule = () => {
    return <Plugin providers={[wbPageModelProvider]} />;
};
