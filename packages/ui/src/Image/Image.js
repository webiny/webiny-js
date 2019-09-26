// @flow
import * as React from "react";

// Accepts all props that a normal <img> element would accept.
type Props = Object;

const Image = ({ ...rest }: Props) => {
    const finalProps = { ...rest };
    if (finalProps.srcSet && typeof finalProps.srcSet === "object") {
        finalProps.srcSet = Object.keys(finalProps.srcSet)
            .map(key => `${finalProps.srcSet[key]} ${key}`)
            .join(", ");
    }

    return <img {...finalProps} />;
};

export { Image };
