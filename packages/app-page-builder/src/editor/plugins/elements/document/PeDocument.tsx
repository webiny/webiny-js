import React from "react";
import { PbEditorElement } from "~/types";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import { DocumentComponent } from "@webiny/app-page-builder-elements/renderers/document";
import { Element } from "@webiny/app-page-builder-elements/types";
import { useElementById } from "~/editor/hooks/useElementById";

interface PeDocumentProps {
    element: PbEditorElement;
}

const PeDocument: React.FC<PeDocumentProps> = props => {
    const { element } = props;
    const { renderers } = usePageElements();
    const Document = renderers.document as DocumentComponent;

    const elements: Array<Element> = [];
    element.elements.forEach(id => {
        const [element] = useElementById(id as string);
        if (element) {
            elements.push(element as Element);
        }
    });

    return <Document element={element as Element} elements={elements} />;
};

export default PeDocument;


// import React from "react";
// import Element from "../../../components/Element";
// import invariant from "invariant";
// import { PbEditorElement } from "~/types";
//
// interface DocumentProps {
//     element: PbEditorElement;
// }
//
// declare global {
//     namespace JSX {
//         interface IntrinsicElements {
//             "pb-document": any;
//         }
//     }
// }
//
// const Document: React.FC<DocumentProps> = ({ element }) => {
//     return (
//         <pb-document
//             style={{ display: "block" }}
//             class={"webiny-pb-page-document"}
//             data-testid={"pb-editor-page-canvas-section"}
//         >
//             {element.elements.map((target, index) => {
//                 const id = typeof target === "string" ? target : target.id;
//                 invariant(
//                     id,
//                     `Could not determine id of child #${index} in element with id "${element.id}".`
//                 );
//                 return <Element key={id} id={id} />;
//             })}
//         </pb-document>
//     );
// };
//
// export default React.memo(Document);
