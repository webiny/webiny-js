import React from "react";
import type { DocsExplorerPresenter } from "../abstractions.js";

interface DocsTypeRefProps {
    typeRef: DocsExplorerPresenter.TypeRef;
    presenter: DocsExplorerPresenter.Interface;
}

export const DocsTypeRef = (props: DocsTypeRefProps) => {
    if (!props.typeRef.isNavigable) {
        return <span className="text-green-700">{props.typeRef.displayName}</span>;
    }

    return (
        <button
            className="text-blue-600 hover:underline cursor-pointer bg-transparent border-none p-0 font-inherit text-inherit"
            onClick={() => props.presenter.navigateToType(props.typeRef.name)}
        >
            {props.typeRef.displayName}
        </button>
    );
};
