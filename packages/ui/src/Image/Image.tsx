import React from "react";

// Accepts all props that a normal <img> element would accept.
interface Props
    extends React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    [key: string]: any;
}

const Image = ({ ...rest }: Props) => {
    const finalProps = { ...rest };
    const srcSet = finalProps.srcSet;
    if (srcSet && typeof srcSet === "object") {
        finalProps.srcSet = Object.keys(srcSet)
            .map(key => `${srcSet[key]} ${key}`)
            .join(", ");
    }

    return <img {...finalProps} />;
};

export { Image };
