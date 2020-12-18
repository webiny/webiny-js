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

const HeadlessCmsApiUrls = function() {
    const { identity } = useSecurity();
    const { getLocales } = useI18N();
    const { showSnackbar } = useSnackbar();

    const hasPermission = identity.getPermission("cms");
    if (!hasPermission) {
        return null;
    }

    const graphqlApiUrl = process.env.REACT_APP_API_URL;

    return (
        <div>
            <Typography use={"headline6"} style={{ fontSize: "1.4rem" }}>
                Headless CMS
            </Typography>
            {getLocales().map(locale => {
                return (
                    <div key={locale.code} className={style.aliasContainer}>
                        <Typography use={"headline6"}>Locale: {locale.code}</Typography>
                        <div className={style.apiUrl}>
                            <Typography use={"subtitle1"} className={style.aliasTitle}>
                                Content Delivery API:
                            </Typography>
                            <a
                                href={`${graphqlApiUrl}/cms/read/${locale.code}`}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {`${graphqlApiUrl}/cms/read/${locale.code}`}
                            </a>
                            <CopyButton
                                value={`${graphqlApiUrl}/cms/read/${locale.code}`}
                                onCopy={() => showSnackbar("Successfully copied!")}
                            />
                        </div>
                        <div className={style.apiUrl}>
                            <Typography use={"subtitle1"} className={style.aliasTitle}>
                                Content Preview API:
                            </Typography>
                            <a
                                href={`${graphqlApiUrl}/cms/preview/${locale.code}`}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {`${graphqlApiUrl}/cms/preview/${locale.code}`}
                            </a>
                            <CopyButton
                                value={`${graphqlApiUrl}/cms/preview/${locale.code}`}
                                onCopy={() => showSnackbar("Successfully copied!")}
                            />
                        </div>
                        <div className={style.apiUrl}>
                            <Typography use={"subtitle1"} className={style.aliasTitle}>
                                Content Management API:
                            </Typography>
                            <a
                                href={`${graphqlApiUrl}/cms/manage/${locale.code}`}
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                {`${graphqlApiUrl}/cms/manage/${locale.code}`}
                            </a>
                            <CopyButton
                                value={`${graphqlApiUrl}/cms/manage/${locale.code}`}
                                onCopy={() => showSnackbar("Successfully copied!")}
                            />
                        </div>
                        <br />
                    </div>
                );
            })}
        </div>
    );
};

export default HeadlessCmsApiUrls;
