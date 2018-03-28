import React from "react";

export default components => {
    const FinalCmp = components.reduce((Res, Cmp) => {
        if (!Res) {
            return React.createElement(Cmp);
        }

        return React.createElement(Cmp, {}, Res);
    }, null);

    return props => {
        return React.cloneElement(FinalCmp, props);
    };
};
