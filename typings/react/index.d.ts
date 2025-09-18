// types/react/index.js
import "react";
import React from "react";

declare global {
    namespace JSX {
        // forward everything from React 19's JSX namespace
        interface IntrinsicElements extends React.JSX.IntrinsicElements {}
        interface IntrinsicAttributes extends React.JSX.IntrinsicAttributes {}
        type Element = React.JSX.Element;
        type ElementClass = React.JSX.ElementClass;
        type ElementChildrenAttribute = React.JSX.ElementChildrenAttribute;
        type LibraryManagedAttributes<C, P> = React.JSX.LibraryManagedAttributes<C, P>;
    }
}
