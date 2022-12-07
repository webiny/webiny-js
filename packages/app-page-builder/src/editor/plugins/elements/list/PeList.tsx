import React, { useMemo } from "react";
import Text from "~/editor/components/Text";
import { MediumEditorOptions, PbEditorElement } from "~/types";
import { getMediumEditorOptions } from "../utils/textUtils";
import { usePageElements } from "@webiny/app-page-builder-elements/hooks/usePageElements";
import {
    ListComponent,
    ListComponentProps
} from "@webiny/app-page-builder-elements/renderers/list";
import { Element } from "@webiny/app-page-builder-elements/types";

const DEFAULT_EDITOR_OPTIONS = {
    toolbar: {
        buttons: ["bold", "italic", "underline", "anchor", "unorderedlist", "orderedlist"]
    },
    anchor: {
        targetCheckbox: true,
        targetCheckboxText: "Open in a new tab"
    }
};

interface PeListProps {
    isActive?: boolean;
    element: PbEditorElement;
    mediumEditorOptions?: MediumEditorOptions;
}

const PeList: React.FC<PeListProps> = props => {
    const { element, isActive, mediumEditorOptions } = props;
    const { renderers } = usePageElements();

    const List = renderers.list as ListComponent;

    const EditorComponent = useMemo<ListComponentProps["as"]>(() => {
        return function EditorComponent({ className }) {
            return (
                <Text
                    tag={["pb-list", { class: className }]}
                    elementId={element.id}
                    mediumEditorOptions={getMediumEditorOptions(
                        DEFAULT_EDITOR_OPTIONS,
                        mediumEditorOptions
                    )}
                />
            );
        };
    }, []);

    if (isActive) {
        return <List element={element as Element} as={EditorComponent} />;
    }

    return <List element={element as Element} />;
};
export default PeList;
