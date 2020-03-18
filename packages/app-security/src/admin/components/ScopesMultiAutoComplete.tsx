import React, { useEffect, useState } from "react";
import { i18n } from "@webiny/app/i18n";
import { MultiAutoComplete } from "@webiny/ui/AutoComplete";
import { getPlugins } from "@webiny/plugins";
import { SecurityScopesListPlugin } from "@webiny/app-security/types";
import { Typography } from "@webiny/ui/Typography";
import { css } from "emotion";

const t = i18n.ns("app-security/admin/roles/form");

const styles = {
    wrapper: css({
        ".mdc-elevation--z1": {
            maxHeight: 275
        }
    })
};

const ScopesMultiAutoComplete = props => {
    const [scopesList, setScopesList] = useState([]);

    useEffect(() => {
        const getScopesList = async () => {
            const plugins = getPlugins<SecurityScopesListPlugin>("security-scopes-list");
            const scopes = [];
            for (let i = 0; i < plugins.length; i++) {
                const plugin = plugins[i];
                if (!plugin.scopes) {
                    throw new Error(
                        `Missing "scopes" key in registered "security-scopes-list" plugin. The name of the plugin is "${plugin.name ||
                            "undefined"}"`
                    );
                }

                let pluginScopes = plugin.scopes;

                if (typeof pluginScopes === "function") {
                    pluginScopes = await pluginScopes();
                }

                scopes.push(...pluginScopes);
            }

            setScopesList(scopes);
        };

        getScopesList();
    }, []);

    return (
        <span className={styles.wrapper}>
            <MultiAutoComplete
                useSimpleValues
                options={scopesList.map(({ scope }) => scope)}
                label={t`Scopes`}
                description={t`Choose one or more scopes.`}
                unique
                renderItem={item => {
                    const scope = scopesList.find(current => current.scope === item);

                    return (
                        <>
                            <div>
                                <strong>
                                    <Typography use={"subtitle1"}>
                                        <strong>{scope.title}</strong>
                                    </Typography>
                                </strong>
                            </div>
                            <div>
                                <Typography use={"subtitle2"}>{scope.description}</Typography>
                            </div>
                            <div>
                                <Typography use={"caption"}>{scope.scope}</Typography>
                            </div>
                        </>
                    );
                }}
                {...props}
            />
        </span>
    );
};

export default ScopesMultiAutoComplete;
