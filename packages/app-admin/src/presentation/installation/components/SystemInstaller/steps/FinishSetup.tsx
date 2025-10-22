import React, { useEffect } from "react";
import { Text, Button, Grid, Loader, Alert } from "@webiny/admin-ui";
import { Center } from "./Center.js";
import { Container } from "./Container.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

interface StepProps {
    error?: Error;
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

    return (
        <Container
            title={"Finish setup"}
            message={"We're finalizing installation of Webiny...please wait."}
        >
            <Center>
                <div style={{ width: 400 }}>
                    <Grid>
                        {error ? (
                            <Grid.Column span={12}>
                                <Alert type={"danger"}>{error.message}</Alert>
                            </Grid.Column>
                        ) : (
                            <></>
                        )}
                        {installing ? (
                            <Grid.Column span={12}>
                                <div className="wby-flex wby-flex-col wby-items-center wby-gap-4">
                                    <Loader
                                        size="md"
                                        variant="accent"
                                        indeterminate={true}
                                        text="Installing Webiny..."
                                    />
                                </div>
                            </Grid.Column>
                        ) : (
                            <></>
                        )}
                        {isInstalled ? (
                            <Grid.Column span={12}>
                                <Text size={"md"} className={"wby-text-neutral-dimmed"}>
                                    Setup complete! Everything went smooth as a breeze!
                                </Text>
                            </Grid.Column>
                        ) : (
                            <></>
                        )}
                        {!error ? (
                            <Grid.Column span={12}>
                                <Button
                                    disabled={!isInstalled}
                                    containerClassName={"wby-w-full"}
                                    className={"wby-w-full"}
                                    variant={"primary"}
                                    size={"lg"}
                                    text={"Start using Webiny"}
                                    onClick={finishInstallation}
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
