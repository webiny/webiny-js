import React, { useCallback, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import get from "lodash/get";
import classNames from "classnames";
import { CoreOptions } from "medium-editor";
import { PbEditorElement } from "~/types";
import { elementWithChildrenByIdSelector, activeElementAtom, uiAtom } from "../../recoil/modules";
import { ElementRoot } from "~/render/components/ElementRoot";
import useUpdateHandlers from "../../plugins/elementSettings/useUpdateHandlers";
import ReactMediumEditor from "../../components/MediumEditor";
import { applyFallbackDisplayMode } from "../../plugins/elementSettings/elementSettingsUtils";

export const textClassName = "webiny-pb-base-page-element-style webiny-pb-page-element-text";
const DATA_NAMESPACE = "data.text";

type TextElementProps = {
    elementId: string;
    mediumEditorOptions: CoreOptions;
    rootClassName?: string;
};
const PbText: React.FunctionComponent<TextElementProps> = ({
    elementId,
    mediumEditorOptions,
    rootClassName
}) => {
    const element: PbEditorElement = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const [{ displayMode }] = useRecoilState(uiAtom);
    const [activeElementId, setActiveElementAtomValue] = useRecoilState(activeElementAtom);
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const value = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

    const onChange = useCallback(
        value => {
            getUpdateValue(DATA_NAMESPACE)(value);
        },
        [getUpdateValue]
    );

    const onSelect = useCallback(() => {
        // Mark element active on editor element selection
        if (elementId && activeElementId !== elementId) {
            setActiveElementAtomValue(elementId);
        }
    }, [activeElementId, elementId]);

    // required due to re-rendering when set content atom and still nothing in elements atom
    if (!element) {
        return null;
    }

    const textContent = get(element, `${DATA_NAMESPACE}.data.text`);
    const tag = get(value, "tag");
    const typography = get(value, "typography");

    return (
        <ElementRoot
            element={element}
            className={classNames(textClassName, rootClassName, typography)}
        >
            <ReactMediumEditor
                elementId={elementId}
                tag={tag}
                value={textContent}
                onChange={onChange}
                options={mediumEditorOptions}
                onSelect={onSelect}
            />
        </ElementRoot>
    );
};

export default React.memo(PbText);
