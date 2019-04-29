import React, { useCallback } from "react";
import { withRouter } from "react-router-dom";
import { compose } from "recompose";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "webiny-app/i18n";
import { withCrud } from "webiny-admin/components";
import { SplitView, LeftPanel, RightPanel } from "webiny-admin/components/SplitView";
import { FloatingActionButton } from "webiny-admin/components/FloatingActionButton";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";

import { loadMenu, loadMenus, createMenu, updateMenu, deleteMenu } from "./graphql";

const t = i18n.namespace("Cms.Menus");

function Menus({ formProps, listProps, location, history }) {
    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

    return (
        <React.Fragment>
            <SplitView>
                <LeftPanel span={4}>
                    <MenusDataList {...listProps} />
                </LeftPanel>
                <RightPanel span={8}>
                    <MenusForm {...formProps} />
                </RightPanel>
            </SplitView>
            <FloatingActionButton onClick={createNew} />
        </React.Fragment>
    );
}

export default compose(
    withCrud({
        list: {
            get: {
                query: loadMenus,
                variables: { sort: { savedOn: -1 } },
                response: data => get(data, "cms.menus")
            },
            delete: {
                mutation: deleteMenu,
                response: data => data.cms.deleteMenu,
                snackbar: data => t`Menu {name} deleted.`({ name: data.name })
            }
        },
        form: {
            get: {
                query: loadMenu,
                response: data => get(data, "cms.menu")
            },
            save: {
                create: createMenu,
                update: updateMenu,
                response: data => data.cms.menu,
                variables: data => ({
                    data: pick(data, ["items", "title", "slug", "description"])
                }),
                snackbar: data => t`Menu {name} saved successfully.`({ name: data.title })
            }
        }
    }),
    withRouter
)(Menus);
