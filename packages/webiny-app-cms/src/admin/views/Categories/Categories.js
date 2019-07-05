import React from "react";
import { compose } from "recompose";
import { withRouter } from "react-router-dom";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "webiny-app/i18n";
import { withCrud } from "webiny-admin/components";
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

const Categories = ({ formProps, listProps, location, history }) => {
    const createNew = React.useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

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
            <FloatingActionButton onClick={createNew} />
        </React.Fragment>
    );
};

export default compose(
    withCrud({
        list: {
            get: {
                query: loadCategories,
                variables: { sort: { savedOn: -1 } },
                response: data => get(data, "cms.pageBuilder.categories")
            },
            delete: {
                mutation: deleteCategory,
                response: data => data.cms.pageBuilder.deleteCategory,
                snackbar: data => t`Category {name} deleted.`({ name: data.name })
            }
        },
        form: {
            get: {
                query: loadCategory,
                response: data => get(data, "cms.pageBuilder.category")
            },
            save: {
                create: createCategory,
                update: updateCategory,
                response: data => data.cms.pageBuilder.category,
                variables: form => ({
                    data: pick(form, ["name", "slug", "url", "layout"])
                }),
                snackbar: data => t`Category {name} saved successfully.`({ name: data.name })
            }
        }
    }),
    withRouter
)(Categories);
