import React, { useCallback } from "react";
import { pick } from "lodash";
import { get } from "dot-prop-immutable";
import { compose } from "recompose";
import { SplitView, LeftPanel, RightPanel } from "@webiny/app-admin/components/SplitView";
import { FloatingActionButton } from "@webiny/app-admin/components/FloatingActionButton";
import { withCrud } from "@webiny/app-admin/components";
import { i18n } from "@webiny/app/i18n";
import { withRouter } from "react-router-dom";

import I18NLocalesDataList from "./I18NLocales/I18NLocalesDataList";
import I18NLocalesForm from "./I18NLocales/I18NLocalesForm";
import {
    loadLocale,
    loadI18NLocales,
    createI18NLocale,
    updateI18NLocale,
    deleteI18NLocale
} from "./I18NLocales/graphql";

const t = i18n.namespace("I18N.I18NLocales");

function I18NLocales({ scopes, location, history, formProps, listProps }) {
    const createNew = useCallback(() => {
        const query = new URLSearchParams(location.search);
        query.delete("id");
        history.push({ search: query.toString() });
    });

    return (
        <React.Fragment>
            <SplitView>
                <LeftPanel>
                    <I18NLocalesDataList {...listProps} />
                </LeftPanel>
                <RightPanel>
                    <I18NLocalesForm scopes={scopes} {...formProps} />
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
                query: loadI18NLocales,
                variables: { sort: { savedOn: -1 } },
                response: data => get(data, "i18n.i18NLocales")
            },
            delete: {
                mutation: deleteI18NLocale,
                response: data => data.i18n.deleteI18NLocale,
                snackbar: data => t`Language {name} deleted.`({ name: data.name })
            }
        },
        form: {
            get: {
                query: loadLocale,
                response: data => get(data, "i18n.locale")
            },
            save: {
                create: createI18NLocale,
                update: updateI18NLocale,
                response: data => data.i18n.locale,
                variables: form => ({
                    data: pick(form, ["code", "default"])
                }),
                snackbar: data => t`Language {name} saved successfully.`({ name: data.name })
            }
        }
    }),
    withRouter
)(I18NLocales);
