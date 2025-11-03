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
                    <img src={splashImage} className={"wby-m-auto"} />
                </Center>
            ) : null}
            <Center>
                <Heading level={3} className={"wby-mb-md wby-pt-xxl wby-text-accent-primary"}>
                    {title}
                </Heading>
            </Center>
            <Text
                as="div"
                size={"md"}
                className={"wby-mb-lg wby-text-center wby-text-neutral-muted"}
            >
                {message}
            </Text>
            {children}
        </div>
    );
};
