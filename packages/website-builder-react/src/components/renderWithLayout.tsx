import React from "react";

export type DocumentLayout = (args: { content: React.ReactNode }) => React.ReactNode;

export const renderWithLayout = (content: React.ReactNode, layout?: DocumentLayout) => {
    return layout ? <>{layout({ content })}</> : content;
};
