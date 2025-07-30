import * as React from "react";
import { Logo, makeDecoratable } from "@webiny/app-admin";
import { Alert, Grid, Heading, Text } from "@webiny/admin-ui";

export interface ContainerProps {
    children: React.ReactNode;
}

const Container = makeDecoratable("ViewContainer", ({ children }: ContainerProps) => {
    return (
        <div className={"wby-w-full wby-h-screen wby-bg-neutral-light wby-flex-1"}>
            <section
                className={"wby-m-auto wby-flex wby-flex-col wby-justify-center wby-min-h-screen"}
            >
                <div className={"wby-mx-auto"}>
                    <Logo />
                </div>
                <div className={"wby-w-full wby-max-w-[480px] wby-mx-auto wby-my-lg"}>
                    {children}
                </div>
            </section>
        </div>
    );
});

export interface ContentProps {
    children: React.ReactNode;
}

const Content = makeDecoratable("ViewContent", ({ children }: ContentProps) => (
    <div className={"wby-relative wby-p-lg wby-pt-md wby-bg-neutral-base wby-rounded-xl"}>
        {children}
    </div>
));

export interface FooterProps {
    children: React.ReactNode;
}

const Footer = makeDecoratable("ViewFooter", ({ children }: FooterProps) => {
    return (
        <Grid>
            <Grid.Column span={12} className={"wby-text-center wby-mt-lg"}>
                {children}
            </Grid.Column>
        </Grid>
    );
});

export interface TitleProps {
    title: string;
    description?: React.ReactNode;
}

const Title = makeDecoratable("ViewTitle", ({ title, description }: TitleProps) => {
    return (
        <div className={"wby-mb-md"}>
            <Heading level={4}>{title}</Heading>
            {description && (
                <Text as={"div"} size={"sm"} className={"wby-text-neutral-strong"}>
                    {description}
                </Text>
            )}
        </div>
    );
});

export interface ErrorProps {
    title?: string;
    description?: string | null;
}

export const Error = ({ title = "Something went wrong", description }: ErrorProps) => {
    if (!description) {
        return null;
    }

    return (
        <div className={"wby-mb-lg"}>
            <Alert title={title} type={"danger"}>
                {description}
            </Alert>
        </div>
    );
};

export const View = {
    Container,
    Content,
    Title,
    Footer,
    Error
};
