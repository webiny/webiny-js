import React from "react";
import { Button } from "@webiny/admin-ui";
import introductionSvg from "./introduction.svg";
import { Center } from "./Center.js";
import { Container } from "./Container.js";
import type { ISystemInstallerPresenter } from "~/presentation/installation/presenters/SystemInstaller/abstractions.js";

interface IntroductionStepProps {
    nextStep: ISystemInstallerPresenter["nextStep"];
}

export const IntroductionStep = ({ nextStep }: IntroductionStepProps) => {
    return (
        <Container
            title={"Almost there..."}
            message={
                "To finalize the setup of your Webiny instance, we just need a few final details. " +
                "Follow this quick wizard—it should only take a few seconds to complete."
            }
            splashImage={introductionSvg}
        >
            <Center>
                <Button
                    variant={"primary"}
                    size={"lg"}
                    text={"Let's get started"}
                    onClick={() => nextStep()}
                />
            </Center>
        </Container>
    );
};
