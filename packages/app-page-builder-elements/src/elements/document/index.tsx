import React from "react";
import { PageElement } from "~/types";
import { ElementChildren } from "~/components/Element";

const Document = ({ element }: { element: PageElement }) => {
    return (
        <div className={"webiny-pb-page-document"}>
            <ElementChildren element={element} />
        </div>
    );
};

export default Document;
