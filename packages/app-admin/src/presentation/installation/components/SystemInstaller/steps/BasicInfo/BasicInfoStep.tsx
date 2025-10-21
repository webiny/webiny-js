import React from "react";
import { Button, Heading, Text } from "@webiny/admin-ui";
import introductionSvg from "./introduction.svg";
import { Center } from "../Center.js";

interface IntroductionStepProps {
    nextStep: () => void;
}

export const BasicInfoStep = ({ nextStep }: IntroductionStepProps) => {
    return (
        <div className={"wby-w-[516px] wby-pt-xxl"}>
            <Center>
                <img src={introductionSvg} className={"wby-m-auto"}/>
            </Center>
            <Center>
                <Heading level={3} className={"wby-mb-md wby-pt-xxl"}>
                    Almost there...
                </Heading>
            </Center>
            <Center>
                <Text as="div" size={"sm"} className={"wby-mb-md"}>
                    To finalize the setup of your Webiny instance, we just need a few final details.
                    Follow this quick wizard—it should only take a few seconds to complete.
                </Text>
            </Center>
            <Center>
                <Button
                    variant={"primary"}
                    size={"lg"}
                    text={"Let's get started"}
                    onClick={nextStep}
                />
            </Center>
        </div>
    );
};
