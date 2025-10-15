import React from 'react';

export type CardRootProps = React.HTMLAttributes<HTMLDivElement>;

export const CardRoot = ({ children, ...props }: CardRootProps) => {
    return <div {...props}>{children}</div>;
};
