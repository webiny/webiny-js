import React from "react";

export interface Image {
    id: string;
    name: string;
    src: string;
}

interface ImagesListComponentProps {
    images: Image[];
}

export type ImagesListComponent = React.ComponentType<ImagesListComponentProps>;
