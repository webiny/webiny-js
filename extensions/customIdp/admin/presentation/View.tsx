import React from "react";
import { Heading, Text, Logo } from "webiny/admin/ui";

export interface ContainerProps {
    children: React.ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
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
};

export interface ContentProps {
    children: React.ReactNode;
}

export const Content = ({ children }: ContentProps) => (
    <div className={"relative p-lg pt-md bg-neutral-base rounded-xl"}>{children}</div>
);

export interface TitleProps {
    title: string;
    description?: React.ReactNode;
}

export const Title = ({ title, description }: TitleProps) => {
    return (
        <div className={"mb-md"}>
            <Heading level={4}>{title}</Heading>
            {description && (
                <Text as={"div"} size={"sm"} className={"text-neutral-strong"}>
                    {description}
                </Text>
            )}
        </div>
    );
};
