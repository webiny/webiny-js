import React from "react";
/**
 * Package react-columned does not have types.
 */
// @ts-expect-error
import Columned from "react-columned";

export interface MosaicProps {
    // Number of columns, per max screen size, eg. { "320": 1, "480": 2, "800": 3, "1366": 4 }.
    columns?: {
        [key: string]: number;
    };

    // Custom class for the mosaic container.
    className?: string;

    children: React.ReactNode;
}

const Mosaic = ({ children, columns, className }: MosaicProps) => {
    return (
        <Columned columns={columns} className={className}>
            {children}
        </Columned>
    );
};

Mosaic.defaultProps = {
    columns: { 320: 1, 480: 2, 800: 3, 1366: 4 }
};

export { Mosaic };
