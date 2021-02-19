import React, { useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import get from "lodash/get";
import classNames from "classnames";
import { PbEditorElement } from "../../../../../types";
import { elementWithChildrenByIdSelector, uiAtom, pageAtom } from "../../../../recoil/modules";
import { ElementRoot } from "../../../../../render/components/ElementRoot";
import { applyFallbackDisplayMode } from "../../../../plugins/elementSettings/elementSettingsUtils";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";
const DATA_NAMESPACE = "data.text";

type TextElementProps = {
    elementId: string;
    editorOptions: any;
    rootClassName?: string;
};
const Text: React.FunctionComponent<TextElementProps> = ({ elementId, rootClassName }) => {
    const element: PbEditorElement = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const pageAtomValue = useRecoilValue(pageAtom);
    const [{ displayMode }] = useRecoilState(uiAtom);

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

    if (!element) {
        return null;
    }

    let text = get(element, `data.text.data.text`);
    const elementDataSource = get(element, `data.dataSource`);
    if (elementDataSource.path.includes(".")) {
        try {
            const pageDataSource = pageAtomValue.dataSources.find(
                ds => ds.id === elementDataSource.id
            );
            text = get(pageDataSource.data, elementDataSource.path);
            if (typeof text !== "string") {
                text = get(element, `data.text.data.text`);
            }
        } catch {}
    }

    const tag = get(value, "tag");
    const typography = get(value, "typography");

    return (
        <ElementRoot
            element={element}
            className={classNames(textClassName, rootClassName, typography)}
        >
            {React.createElement(tag, null, text)}
        </ElementRoot>
    );
};
export default React.memo(Text);
