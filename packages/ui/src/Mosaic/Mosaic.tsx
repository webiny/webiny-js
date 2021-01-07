import React from "react";
import Columned from "react-columned";

export type MosaicProps = {
    // An array of elements that need to be shown, for example images.
    children: React.ReactNode;

    // Number of columns, per max screen size, eg. { "320": 1, "480": 2, "800": 3, "1366": 4 }.
    columns: { [key: string]: number };

    // Custom class for the mosaic container.
    className?: string;
};

export function Mosaic({ children, columns, className }: MosaicProps) {
    return (
        <Columned columns={columns} className={className}>
            {children}
        </Columned>
    );
}

Mosaic.defaultProps = {
    columns: { 320: 1, 480: 2, 800: 3, 1366: 4 }
};
