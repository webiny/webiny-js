import React from "react";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";
import { CrudProvider } from "@webiny/app-admin/contexts/Crud";

import {
    READ_CATEGORY,
    LIST_CATEGORIES,
    CREATE_CATEGORY,
    UPDATE_CATEGORY,
    DELETE_CATEGORY
} from "./graphql";

const Categories = () => {
    return (
        <CrudProvider
            delete={DELETE_CATEGORY}
            read={READ_CATEGORY}
            create={CREATE_CATEGORY}
            update={UPDATE_CATEGORY}
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
