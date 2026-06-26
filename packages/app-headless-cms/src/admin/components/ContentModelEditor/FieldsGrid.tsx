import React from "react";

interface FieldsGridProps {
    children: React.ReactNode;
}

const FieldsGrid = ({ children }: FieldsGridProps) => (
    <div className={"flex flex-wrap gap-xs-plus py-sm px-md"}>{children}</div>
);

export { FieldsGrid, type FieldsGridProps };
