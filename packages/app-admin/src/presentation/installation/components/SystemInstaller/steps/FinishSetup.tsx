import React, { useEffect } from "react";
import { Button, Grid, Loader, Alert } from "@webiny/admin-ui";
import { Center } from "./Center.js";
import { Container } from "./Container.js";
import type {
    ErrorObject,
    ISystemInstallerPresenter
} from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";
import { handleStartUsing } from "./FinishSetup/handleStartUsing.js";
import { handleRestartInstallation } from "./FinishSetup/handleRestartInstallation.js";

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
