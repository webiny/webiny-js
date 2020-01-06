//@flow
import React from "react";
import Element from "@webiny/app-page-builder/editor/components/Element";
import type { PbElement } from "@webiny/app-page-builder/admin/types";

const Document = React.memo(({ element }: { element: PbElement }) => {
    return (
        <div className={"webiny-pb-page-document"}>
            {element.elements.map(el => (
                <Element key={el} id={el} />
            ))}
        </div>
    );
});

export default Document;
