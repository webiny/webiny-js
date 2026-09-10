import React from "react";

export const Container = ({ children }: { children: React.ReactNode }) => {
    return <div className={"flex justify-center mt-md"}>{children}</div>;
};
