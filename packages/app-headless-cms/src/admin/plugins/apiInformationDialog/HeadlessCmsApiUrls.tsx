import React, { useState } from "react";
import { useQuery } from "react-apollo";
import { css } from "emotion";
import { CopyButton } from "@webiny/ui/Button";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { LIST_ENVIRONMENT_ALIASES } from "@webiny/app-headless-cms/admin/views/EnvironmentAliases/graphql";
import { Typography } from "@webiny/ui/Typography";
import { toLower } from "lodash";
import get from "lodash/get";

const style = {
    apiUrl: css({
        display: "flex",
        alignItems: "center"
    }),
    aliasTitle: css({
        minWidth: "200px"
    }),
    aliasContainer: css({
        marginTop: "10px"
    })
};

const HeadlessCmsApiUrls = function({ name = null, type = null }) {
    const { showSnackbar } = useSnackbar();
    const graphqlApiUrl = process.env.REACT_APP_API_URL;
    const [totalAliases, setTotalAliases] = useState([]);
    const {
        environments: { currentEnvironment }
    } = useCms();

    useQuery(LIST_ENVIRONMENT_ALIASES, {
        onCompleted: data => {
            setTotalAliases(data.cms.environmentAliases.data);
        }
    });

    return (
        <div>
            <Typography use={"headline6"} style={{ fontSize: "1.4rem" }}>
                Headless CMS - {name || get(currentEnvironment, "name")}
            </Typography>
            {totalAliases
                .filter(elem => {
                    if (type === "aliases") {
                        return elem.name === name;
                    } else if (type === "environment") {
                        return get(elem, "environment.name") === name;
                    } else {
                        return get(elem, "environment.name") === currentEnvironment.name;
                    }
                })
                .map(elem => {
                    return (
                        <div key={elem.id} className={style.aliasContainer}>
                            <Typography use={"headline6"}>Alias: {elem.name}</Typography>
                            <div className={style.apiUrl}>
                                <Typography use={"subtitle1"} className={style.aliasTitle}>
                                    Content Delivery API:
                                </Typography>
                                <a
                                    href={`${graphqlApiUrl}/cms/read/${toLower(elem.name)}`}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    {`${graphqlApiUrl}/cms/read/${toLower(elem.name)}`}
                                </a>
                                <CopyButton
                                    value={`${graphqlApiUrl}/cms/read/${toLower(elem.name)}`}
                                    onCopy={() => showSnackbar("Successfully copied!")}
                                />
                            </div>
                            <div className={style.apiUrl}>
                                <Typography use={"subtitle1"} className={style.aliasTitle}>
                                    Content Preview API:
                                </Typography>
                                <a
                                    href={`${graphqlApiUrl}/cms/preview/${toLower(elem.name)}`}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    {`${graphqlApiUrl}/cms/preview/${toLower(elem.name)}`}
                                </a>
                                <CopyButton
                                    value={`${graphqlApiUrl}/cms/preview/${toLower(elem.name)}`}
                                    onCopy={() => showSnackbar("Successfully copied!")}
                                />
                            </div>
                            <div className={style.apiUrl}>
                                <Typography use={"subtitle1"} className={style.aliasTitle}>
                                    Content Management API:
                                </Typography>
                                <a
                                    href={`${graphqlApiUrl}/cms/manage/${toLower(elem.name)}`}
                                    rel="noopener noreferrer"
                                    target="_blank"
                                >
                                    {`${graphqlApiUrl}/cms/manage/${toLower(elem.name)}`}
                                </a>
                                <CopyButton
                                    value={`${graphqlApiUrl}/cms/manage/${toLower(elem.name)}`}
                                    onCopy={() => showSnackbar("Successfully copied!")}
                                />
                            </div>
                            <br></br>
                        </div>
                    );
                })}
        </div>
    );
};

export default HeadlessCmsApiUrls;
