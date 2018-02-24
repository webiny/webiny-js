import React from "react";

function createComponent(cmps) {
    const FinalCmp = cmps.reduce((Res, Cmp) => {
        if (!Res) {
            return React.createElement(Cmp);
        }

        return React.createElement(Cmp, {}, Res);
    }, null);

    return props => {
        return React.cloneElement(FinalCmp, props);
    };
}

const A = ({ children, ...props }) => {
    return React.cloneElement(children, { ...props, aProp: 1 });
};

const B = ({ children, ...props }) => {
    return React.cloneElement(children, { ...props, bProp: 2 });
};

const C = ({ children, ...props }) => {
    return React.cloneElement(children, { ...props, cProp: 3 });
};

const MyComponent = props => {
    return (
        <div>
            This is my component: {props.name}
            <br /> {Object.keys(props).join(", ")}
        </div>
    );
};

export default createComponent([MyComponent, C, B, A]);
