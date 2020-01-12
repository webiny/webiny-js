import React, { useCallback } from "react";
import { useApolloClient } from "react-apollo";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";

import {
    READ_CATEGORY,
    LIST_CATEGORIES,
    LIST_CATEGORIES_BY_NAME,
    CREATE_CATEGORY,
    UPDATE_CATEGORY,
    DELETE_CATEGORY
} from "./graphql";

const Categories = () => {
    const client = useApolloClient();

    const onCompleted = useCallback(async () => {
        await client.query({
            query: LIST_CATEGORIES_BY_NAME,
            fetchPolicy: "network-only"
        });
    }, []);

    return (
        <CrudProvider
            delete={{
                mutation: DELETE_CATEGORY,
                options: { onCompleted }
            }}
            read={READ_CATEGORY}
            create={{
                mutation: CREATE_CATEGORY,
                options: { onCompleted }
            }}
            update={{
                mutation: UPDATE_CATEGORY,
                options: { onCompleted }
            }}
            list={{
                query: LIST_CATEGORIES,
                variables: { sort: { savedOn: -1 } }
            }}
        >
            {({ actions }) => (
                <>
                    <SplitView>
                        <LeftPanel>
                            <CategoriesDataList />
                        </LeftPanel>
                        <RightPanel>
                            <CategoriesForm />
                        </RightPanel>
                    </SplitView>
                    <FloatingActionButton onClick={actions.resetForm} />
                </>
            )}
        </CrudProvider>
    );
};

export default Categories;
