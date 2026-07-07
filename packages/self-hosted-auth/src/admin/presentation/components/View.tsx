import * as React from "react";
import capitalize from "lodash/capitalize";
import { Logo, makeDecoratable } from "@webiny/app-admin";
import { Alert, Grid, Heading, Text } from "@webiny/admin-ui";

/*
 * Visual shell for the self-hosted login screen. Intentionally identical to the Cognito login
 * screen's `View` (packages/cognito/.../components/View.tsx) so both IdPs look the same.
 */

export interface ContainerProps {
    children: React.ReactNode;
}

const Container = makeDecoratable("SelfHostedViewContainer", ({ children }: ContainerProps) => {
    return (
        <div className={"w-full h-screen bg-neutral-light flex-1"}>
            <section className={"m-auto flex flex-col justify-center min-h-screen"}>
                <div className={"mx-auto"}>
                    <Logo />
                </div>
                <div className={"w-full max-w-[480px] mx-auto my-lg"}>{children}</div>
            </section>
        </div>
    );
});

export interface ContentProps {
    children: React.ReactNode;
}

const Content = makeDecoratable("SelfHostedViewContent", ({ children }: ContentProps) => (
    <div className={"relative p-lg pt-md bg-neutral-base rounded-xl"}>{children}</div>
));

export interface TitleProps {
    title: string;
    description?: React.ReactNode;
}

const Title = makeDecoratable("SelfHostedViewTitle", ({ title, description }: TitleProps) => {
    return (
        <div className={"mb-md"}>
            <Heading level={4}>{capitalize(title)}</Heading>
            {description && (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
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

const Error = ({ title = "Something went wrong", description }: ErrorProps) => {
    if (!description) {
        return null;
    }

    return (
        <div className={"mb-lg"}>
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
    Error
};

export { Grid };
