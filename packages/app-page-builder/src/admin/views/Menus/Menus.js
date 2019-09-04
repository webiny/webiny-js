import React, { useCallback } from "react";
import useReactRouter from "use-react-router";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "@webiny/app/i18n";
import { withCrud } from "@webiny/app-admin/components";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import MenusDataList from "./MenusDataList";
import MenusForm from "./MenusForm";

import { loadMenu, loadMenus, createMenu, updateMenu, deleteMenu } from "./graphql";

const t = i18n.namespace("Pb.Menus");

function Menus({ formProps, listProps }) {
    const { history, location } = useReactRouter();

    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    }, [history, location]);

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

export default withCrud({
    list: {
        get: {
            query: loadMenus,
            variables: { sort: { savedOn: -1 } },
            response: data => get(data, "pageBuilder.menus")
        },
        delete: {
            mutation: deleteMenu,
            response: data => data.pageBuilder.deleteMenu,
            snackbar: data => t`Menu {name} deleted.`({ name: data.name })
        }
    },
    form: {
        get: {
            query: loadMenu,
            response: data => get(data, "pageBuilder.menu")
        },
        save: {
            create: createMenu,
            update: updateMenu,
            response: data => data.pageBuilder.menu,
            variables: data => ({
                data: pick(data, ["items", "title", "slug", "description"])
            }),
            snackbar: data => t`Menu {name} saved successfully.`({ name: data.title })
        }
    }
})(Menus);
