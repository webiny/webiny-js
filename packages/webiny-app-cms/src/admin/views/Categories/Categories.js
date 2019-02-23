// @flow
import * as React from "react";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "webiny-app/i18n";
import { withCrud, type WithCrudProps } from "webiny-admin/components";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { FloatingActionButton } from "webiny-admin/components/FloatingActionButton";
import CategoriesDataList from "./CategoriesDataList";
import CategoriesForm from "./CategoriesForm";

import {
    loadCategory,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "./graphql";

const t = i18n.namespace("Cms.Categories");

const Categories = ({ router, formProps, listProps }: WithCrudProps) => {
    return (
        <React.Fragment>
            <SplitView>
                <LeftPanel>
                    <CategoriesDataList {...listProps} />
                </LeftPanel>
                <RightPanel>
                    <CategoriesForm {...formProps} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton
                onClick={() =>
                    router.goToRoute({
                        params: { id: null },
                        merge: true
                    })
                }
            />
        </React.Fragment>
    );
};

export default withCrud({
    list: {
        get: {
            query: loadCategories,
            variables: { sort: { savedOn: -1 } },
            response: data => get(data, "cms.categories")
        },
        delete: {
            mutation: deleteCategory,
            response: data => data.cms.deleteCategory,
            snackbar: data => t`Category {name} deleted.`({ name: data.name })
        }
    },
    form: {
        get: {
            query: loadCategory,
            response: data => get(data, "cms.category")
        },
        save: {
            create: createCategory,
            update: updateCategory,
            response: data => data.cms.category,
            variables: form => ({
                data: pick(form, ["name", "slug", "url", "layout"])
            }),
            snackbar: data => t`Category {name} saved successfully.`({ name: data.name })
        }
    }
})(Categories);
