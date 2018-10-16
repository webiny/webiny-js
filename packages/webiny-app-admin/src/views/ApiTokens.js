// @flow
import * as React from "react";
import { get } from "dot-prop-immutable";
import { pick } from "lodash";
import { i18n } from "webiny-app/i18n";
import { withCrud, type WithCrudProps } from "webiny-app-admin/components";
import { CompactView, LeftPanel, RightPanel } from "webiny-app-admin/components/Views/CompactView";
import FloatingActionButton from "webiny-app-admin/components/FloatingActionButton";
import ApiTokensDataList from "./ApiTokens/ApiTokensDataList";
import ApiTokensForm from "./ApiTokens/ApiTokensForm";
import {
    createApiToken,
    deleteApiToken,
    loadApiToken,
    loadApiTokens,
    updateApiToken
} from "./ApiTokens/graphql";

const t = i18n.namespace("Security.ApiTokens");

const ApiTokens = ({ formProps, listProps, router }: WithCrudProps) => {
    return (
        <CompactView>
            <LeftPanel>
                <ApiTokensDataList {...listProps} />
            </LeftPanel>
            <RightPanel>
                <ApiTokensForm {...formProps} />
            </RightPanel>

            <FloatingActionButton
                onClick={() =>
                    router.goToRoute({
                        params: { id: null },
                        merge: true
                    })
                }
            />
        </CompactView>
    );
};

export default withCrud({
    list: {
        get: {
            query: loadApiTokens,
            variables: { sort: { savedOn: -1 } },
            response: data => get(data, "security.tokens")
        },
        delete: {
            mutation: deleteApiToken,
            response: data => data.security.deleteApiToken,
            snackbar: data => t`API token {name} deleted.`({ name: data.name })
        }
    },
    form: {
        get: {
            query: loadApiToken,
            response: data => get(data, "security.token")
        },
        save: {
            create: createApiToken,
            update: updateApiToken,
            response: data => get(data, "security.token"),
            variables: form => {
                return {
                    data: pick(form, ["name", "description", "roles", "groups"])
                };
            },
            snackbar: data => t`API token {name} saved successfully.`({ name: data.name })
        }
    }
})(ApiTokens);
