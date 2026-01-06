import React, { useEffect } from "react";
import { Text, Button, Grid, Loader, Alert } from "@webiny/admin-ui";
import { Center } from "./Center.js";
import { Container } from "./Container.js";
import type {
    ErrorObject,
    ISystemInstallerPresenter
} from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

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
                                <Alert type={"danger"} title={error.message}>
                                    {error.data.reason}
                                </Alert>
                            </Grid.Column>
                        ) : (
                            <></>
                        )}
                        {installing ? (
                            <Grid.Column span={12}>
                                <div className="flex flex-col items-center gap-4">
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
                                <Text
                                    as="div"
                                    size={"md"}
                                    className={"text-neutral-strong text-center"}
                                >
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
                                    containerClassName={"w-full"}
                                    className={"w-full"}
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
