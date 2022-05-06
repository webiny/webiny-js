import React, { useEffect, useState } from "react";
import { default as localStorage } from "store";
import { LoginScreen } from "~/index";
import { useSecurity } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { ButtonPrimary } from "@webiny/ui/Button";
import { SplitView, LeftPanel, RightPanel } from "../SplitView";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import { useInstaller } from "./useInstaller";
import Sidebar from "./Sidebar";

declare global {
    interface Window {
        Cypress: any;
    }
}

import {
    Wrapper,
    alertClass,
    InnerContent,
    InstallContent,
    installerSplitView,
    SuccessDialog
} from "./styled";
import { config as appConfig } from "@webiny/app/config";

export const AppInstaller: React.FC = ({ children }) => {
    const tenantId = localStorage.get("webiny_tenant") || "root";
    const lsKey = `webiny_installation_${tenantId}`;
    const wbyVersion = appConfig.getKey("WEBINY_VERSION", process.env.REACT_APP_WEBINY_VERSION);
    const isRootTenant = tenantId === "root";
    /*
     * This flag allows us to avoid rendering the <iframe> when the app is tested with Cypress
     * (Cypress doesn't work with cross domains because of security-related implications).
     * @see https://docs.cypress.io/guides/guides/web-security#Insecure-Content
     */
    const isCypressTest = window && window.Cypress;

    const markInstallerAsCompleted = () => {
        localStorage.set(lsKey, wbyVersion);
    };

    const isInstallerCompleted = () => {
        return localStorage.get(lsKey) === wbyVersion;
    };

    const [finished, setFinished] = useState(false);
    const { identity } = useSecurity();
    const {
        loading,
        installers,
        installer,
        isFirstInstall,
        showNextInstaller,
        showLogin,
        onUser,
        skippingVersions
    } = useInstaller({ isInstalled: isInstallerCompleted() });

    useEffect(() => {
        if (identity) {
            onUser();
        }
    }, [identity]);

    if (isInstallerCompleted()) {
        return <LoginScreen>{children}</LoginScreen>;
    }

    const renderLayout = (content: React.ReactNode, secure = false): React.ReactElement => {
        return (
            <SplitView className={installerSplitView}>
                <LeftPanel span={2}>
                    <Sidebar
                        allInstallers={installers}
                        installer={installer}
                        showLogin={showLogin}
                    />
                </LeftPanel>
                <RightPanel span={10}>
                    {!showLogin && !secure && content}
                    {(showLogin || secure) && <LoginScreen>{content}</LoginScreen>}
                </RightPanel>
            </SplitView>
        );
    };

    const renderBody = (content: React.ReactNode): React.ReactElement => {
        return (
            <Wrapper>
                <InstallContent>
                    <InnerContent>{content}</InnerContent>
                </InstallContent>
            </Wrapper>
        );
    };

    // Loading installers data
    if (loading) {
        return <CircularProgress label={"Checking apps..."} />;
    }

    // This means there are no installers to run or installation was finished
    if (!loading && (installers.length === 0 || finished)) {
        markInstallerAsCompleted();
        return <LoginScreen>{children}</LoginScreen>;
    }

    if (installer) {
        return renderLayout(
            renderBody(installer.render({ onInstalled: showNextInstaller })),
            installer.secure
        );
    }

    if (skippingVersions) {
        return renderBody(
            <Elevation z={1} className={alertClass}>
                <Grid>
                    <Cell span={12}>
                        <Typography use={"headline4"}>Important!</Typography>
                    </Cell>
                    <Cell span={12}>
                        <Typography use={"body1"} tag={"div"}>
                            We&apos;ve detected that your current application is running Webiny{" "}
                            <strong>v{skippingVersions.latest}</strong>. However, your API is
                            running <strong>v{skippingVersions.current}</strong>. Unfortunately, we
                            can&apos;t upgrade your system by skipping versions in between.
                            <br />
                            <br />
                            Here&apos;s a list of versions you skipped, that contain upgrades you
                            need to install:
                            <ul>
                                {skippingVersions.availableUpgrades
                                    .filter(v => v !== skippingVersions.latest)
                                    .map(v => (
                                        <li key={v}>v{v}</li>
                                    ))}
                            </ul>
                            For instructions on how to upgrade Webiny, please consult our{" "}
                            <a
                                href={"https://docs.webiny.com/docs/how-to-guides/upgrade-webiny"}
                                target={"_blank"}
                                rel={"noreferrer noopener"}
                            >
                                Upgrade Webiny
                            </a>{" "}
                            guide. Note that some versions may have a dedicated article with upgrade
                            instructions, so look out for those in the upgrade guide.
                            <br />
                            <br />
                            If you run into problems, find us on our{" "}
                            <a
                                href={"https://www.webiny.com/slack"}
                                target={"_blank"}
                                rel={"noreferrer noopener"}
                            >
                                Slack community.
                            </a>
                        </Typography>
                    </Cell>
                </Grid>
            </Elevation>
        );
    }

    return renderLayout(
        renderBody(
            <Elevation z={1}>
                <SuccessDialog>
                    <p>You have successfully installed all new applications!</p>
                    {!isCypressTest && isRootTenant && isFirstInstall ? (
                        <iframe
                            height="0"
                            width="0"
                            frameBorder="0"
                            style={{ opacity: "0" }}
                            src="https://www.webiny.com/thank-you/new-install"
                        ></iframe>
                    ) : null}
                    <ButtonPrimary
                        data-testid={"open-webiny-cms-admin-button"}
                        onClick={() => {
                            markInstallerAsCompleted();
                            setFinished(true);
                        }}
                    >
                        {isFirstInstall ? "Finish install" : "Finish upgrade"}
                    </ButtonPrimary>
                </SuccessDialog>
            </Elevation>
        ),
        true
    );
};
