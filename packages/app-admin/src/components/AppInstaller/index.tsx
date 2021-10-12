import React, { useEffect, useState } from "react";
import { default as localStorage } from "store";
import { useSecurity } from "@webiny/app-security";
import { useTenancy } from "@webiny/app-tenancy";
import { CircularProgress } from "@webiny/ui/Progress";
import { ButtonPrimary } from "@webiny/ui/Button";
import { SplitView, LeftPanel, RightPanel } from "../SplitView";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Elevation } from "@webiny/ui/Elevation";
import { useInstaller } from "./useInstaller";
import Sidebar from "./Sidebar";
import {
    Wrapper,
    alertClass,
    InnerContent,
    InstallContent,
    installerSplitView,
    SuccessDialog
} from "./styled";

export const AppInstaller = ({ Authentication, children }) => {
    let tenantId = "root";

    const tenancy = useTenancy();
    if (tenancy) {
        tenantId = tenancy.tenant || tenantId;
    }

    const lsKey = `webiny_installation_${tenantId}`;

    const markInstallerAsCompleted = () => {
        localStorage.set(lsKey, process.env.REACT_APP_WEBINY_VERSION);
    };

    const isInstallerCompleted = () => {
        return localStorage.get(lsKey) === process.env.REACT_APP_WEBINY_VERSION;
    };

    const [finished, setFinished] = useState(false);
    const { identity } = useSecurity();
    const {
        loading,
        installers,
        installer,
        showNextInstaller,
        showLogin,
        onUser,
        skippingVersions
    } = useInstaller();

    useEffect(() => {
        if (identity) {
            onUser();
        }
    }, [identity]);

    if (isInstallerCompleted()) {
        return <Authentication>{children}</Authentication>;
    }

    const renderLayout = (content, secure = false) => {
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
                    {(showLogin || secure) && <Authentication>{content}</Authentication>}
                </RightPanel>
            </SplitView>
        );
    };

    const renderBody = content => {
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
        return <Authentication>{children}</Authentication>;
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
                    <ButtonPrimary
                        data-testid={"open-webiny-cms-admin-button"}
                        onClick={() => {
                            markInstallerAsCompleted();
                            setFinished(true);
                        }}
                    >
                        Open Admin Area
                    </ButtonPrimary>
                </SuccessDialog>
            </Elevation>
        ),
        true
    );
};
