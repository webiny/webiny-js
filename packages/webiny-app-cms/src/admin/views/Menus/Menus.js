// @flow
import * as React from "react";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "webiny-app/i18n";
import { withCrud, type WithCrudProps } from "webiny-admin/components";
import { CompactView, LeftPanel, RightPanel } from "webiny-admin/components/CompactView";
import FloatingActionButton from "webiny-admin/components/FloatingActionButton";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";

import { loadMenu, loadMenus, createMenu, updateMenu, deleteMenu } from "./graphql";

const t = i18n.namespace("Cms.Menus");

const Menus = ({ router, formProps, listProps }: WithCrudProps) => {
    return (
        <React.Fragment>
            <CompactView>
                <LeftPanel span={4}>
                    <MenusDataList {...listProps} />
                </LeftPanel>
                <RightPanel span={8}>
                    <MenusForm {...formProps} />
                </RightPanel>
            </CompactView>
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
})(Menus);
