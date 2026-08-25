import React from "react";
import { Text } from "~/components/Text.js";

type HeaderProps = {
    title: string;
    children?: React.ReactNode;
};

export const Header = ({ title, children }: HeaderProps) => {
    return (
        <div className="box-border w-full border-b border-neutral-dimmed px-md py-sm">
            <div className="flex items-center justify-between">
                <Text use={"headline5"}>{title}</Text>
                <div className={"ml-auto"}>{children}</div>
            </div>
        </div>
    );
};
