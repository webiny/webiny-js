import React from "react";

export const ReactComponent = (props: React.SVGProps<SVGSVGElement>) => {
    return <svg data-testid="svg-icon" {...props} />;
};

export default "svg-stub";
