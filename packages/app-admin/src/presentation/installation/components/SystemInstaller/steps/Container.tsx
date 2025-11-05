import React from "react";
import { Heading, Text } from "@webiny/admin-ui";
import { Center } from "~/presentation/installation/components/SystemInstaller/steps/Center.js";

export interface ContainerProps {
    children: React.ReactNode;
    title: string;
    message: string;
    splashImage?: string;
}

export const Container = ({ title, message, splashImage, children }: ContainerProps) => {
    return (
        <div style={{ width: 468, paddingTop: 128 }}>
            {splashImage ? (
                <Center>
                    <img src={splashImage} className={"m-auto"} />
                </Center>
            ) : null}
            <Center>
                <Heading level={3} className={"mb-md pt-xxl text-accent-primary"}>
                    {title}
                </Heading>
            </Center>
            <Text as="div" size={"md"} className={"mb-lg text-center text-neutral-muted"}>
                {message}
            </Text>
            {children}
        </div>
    );
};
