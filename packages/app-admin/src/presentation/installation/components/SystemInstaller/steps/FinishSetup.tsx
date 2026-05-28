import React, { useEffect } from "react";
import { Button, Grid, Loader, Alert } from "@webiny/admin-ui";
import { getMachineId } from "@webiny/telemetry/react.js";
import { Center } from "./Center.js";
import { Container } from "./Container.js";
import type {
    ErrorObject,
    ISystemInstallerPresenter
} from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

const INSTALL_FINISH_URL =
    process.env.REACT_APP_WEBINY_INSTALL_FINISH_URL || "https://www.webiny.com/install/finish";

/**
 * If telemetry is enabled AND the admin is hosted on CloudFront (production
 * deployment), route the "Start using Webiny" CTA through the marketing
 * site's /install/finish page so the website's anonymous wts_did cookie can
 * be aliased to the deployer's machine_id. Falls through to the local
 * `finishInstallation` flow otherwise.
 */
const buildInstallFinishHref = (): string | null => {
    if (process.env.REACT_APP_WEBINY_TELEMETRY === "false") {
        return null;
    }

    if (typeof window === "undefined") {
        return null;
    }
    const isCloudFrontHost = window.location.hostname.endsWith(".cloudfront.net");
    const allowAlternate = Boolean(process.env.REACT_APP_WEBINY_INSTALL_FINISH_URL);
    if (!isCloudFrontHost && !allowAlternate) {
        return null;
    }

    const machineId = getMachineId();
    if (!machineId) {
        return null;
    }

    const currentUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams({
        machine_id: machineId,
        return_to: currentUrl
    });
    return `${INSTALL_FINISH_URL}?${params.toString()}`;
};

const handleRestartInstallation = () => {
    window.location.reload();
};

const handleStartUsing = (finishInstallation: ISystemInstallerPresenter["finishInstallation"]) => {
    if (typeof window !== "undefined") {
        const handoff = buildInstallFinishHref();
        if (handoff) {
            window.location.assign(handoff);
            return;
        }
    }
    finishInstallation();
};

interface StepProps {
    error?: ErrorObject;
    isInstalled: boolean;
    installing: boolean;
    installSystem: ISystemInstallerPresenter["installSystem"];
    finishInstallation: ISystemInstallerPresenter["finishInstallation"];
}

export const FinishSetupStep = ({
    error,
    isInstalled,
    installing,
    installSystem,
    finishInstallation
}: StepProps) => {
    useEffect(() => {
        installSystem();
    }, []);

    const subtitle = isInstalled
        ? "Setup complete! Everything went smooth as a breeze!"
        : "We're finalizing installation of Webiny...please wait.";

    return (
        <Container title={"Finish setup"} message={subtitle}>
            <Center>
                <div style={{ width: 400 }}>
                    <Grid>
                        {error ? (
                            <Grid.Column span={12} className={"flex flex-col gap-4"}>
                                <Alert type={"danger"}>{error.data.reason}</Alert>
                                <Button
                                    containerClassName={"w-full"}
                                    className={"w-full"}
                                    variant={"secondary"}
                                    size={"lg"}
                                    text={"Restart installation"}
                                    onClick={handleRestartInstallation}
                                />
                            </Grid.Column>
                        ) : (
                            <></>
                        )}
                        {installing ? (
                            <Grid.Column span={12}>
                                <div className="flex flex-col items-center gap-4 mt-8">
                                    <Loader
                                        size="lg"
                                        variant="accent"
                                        indeterminate={true}
                                        text="Installing Webiny..."
                                    />
                                </div>
                            </Grid.Column>
                        ) : (
                            <></>
                        )}
                        {!error && isInstalled ? (
                            <Grid.Column span={12}>
                                <Button
                                    containerClassName={"w-full"}
                                    className={"w-full"}
                                    variant={"primary"}
                                    size={"lg"}
                                    text={"Start using Webiny"}
                                    onClick={() => handleStartUsing(finishInstallation)}
                                />
                            </Grid.Column>
                        ) : (
                            <></>
                        )}
                    </Grid>
                </div>
            </Center>
        </Container>
    );
};
