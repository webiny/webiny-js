import React from "react";
import { css } from "emotion";
import { CopyButton } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Typography } from "@webiny/ui/Typography";
import { useSecurity } from "@webiny/app-security";
import { useI18N } from "@webiny/app-i18n/hooks/useI18N";

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

const endpoints = [
    {
        title: "Content Manage API",
        type: "manage"
    },
    {
        title: "Content Read API",
        type: "read"
    },
    {
        title: "Content Preview API",
        type: "preview"
    }
];

const HeadlessCmsApiUrls = () => {
    const { identity } = useSecurity();
    const { getCurrentLocale } = useI18N();
    const { showSnackbar } = useSnackbar();

    const hasPermission = identity.getPermission("cms");
    if (!hasPermission) {
        return null;
    }

    const locale = getCurrentLocale("content");

    const graphqlApiUrl = process.env.REACT_APP_API_URL;

    return (
        <div>
            <Typography use={"headline6"} style={{ fontSize: "1.4rem" }}>
                Headless CMS
            </Typography>

            {endpoints.map(endpoint => (
                <div key={endpoint.type} className={style.apiUrl}>
                    <Typography use={"subtitle1"} className={style.aliasTitle}>
                        {endpoint.title}
                    </Typography>
                    <a
                        href={`${graphqlApiUrl}/cms/${endpoint.type}/${locale}`}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {`${graphqlApiUrl}/cms/${endpoint.type}/${locale}`}
                    </a>
                    <CopyButton
                        value={`${graphqlApiUrl}/cms/${endpoint.type}/${locale}`}
                        onCopy={() => showSnackbar("Successfully copied!")}
                    />
                </div>
            ))}
        </div>
    );
};

export default HeadlessCmsApiUrls;
