import React from "react";

export interface IRowProps {
    children: React.ReactNode;
}

export const Row = ({ children }: IRowProps) => {
    return <div>{children}</div>;
};
