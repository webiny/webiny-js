import React, { CSSProperties } from "react";
import { useRecoilValue } from "recoil";
import styled from "@emotion/styled";
import { css } from "emotion";
import kebabCase from "lodash/kebabCase";
import { IconButton } from "@webiny/ui/Button";
import DropZone from "../../../components/DropZone";
import Element from "../../../components/Element";
import { DragObjectWithTypeWithTargetType } from "../../../components/Droppable";
import { useEventActionHandler } from "../../../provider";
import { DropElementActionEvent, TogglePluginActionEvent } from "../../../recoil/actions";
import { elementByIdSelector, uiAtom } from "../../../recoil/modules";
import { ReactComponent as AddCircleOutline } from "../../../assets/icons/baseline-add_circle-24px.svg";

const addIcon = css({
    color: "var(--mdc-theme-secondary)",
    transition: "transform 0.2s",
    "&:hover": {
        transform: "scale(1.3)"
    },
    "&::before, &::after": {
        display: "none"
    }
});

const BlockContainerInnerWrapStyled = styled("div")({
    position: "relative",
    maxWidth: "100%"
});

type BlockContainerPropsType = {
    combineClassNames: (...classes: string[]) => string;
    elementStyle: CSSProperties;
    elementAttributes: { [key: string]: string };
    customClasses: string[];
    elementId: string;
};
const BlockContainer: React.FunctionComponent<BlockContainerPropsType> = ({
    elementStyle,
    elementAttributes,
    customClasses,
    combineClassNames,
    elementId
}) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementByIdSelector(elementId));
    const { id, path, type, elements } = element;

    const containerStyle = elementStyle;
    // Use per-device style
    const width = elementStyle[`--${kebabCase(displayMode)}-width`];
    /**
     * We're swapping "justifyContent" & "alignItems" value here because
     * ".webiny-pb-layout-block" has "flex-direction: column"
     */
    const alignItems = elementStyle[`--${kebabCase(displayMode)}-justify-content`];
    const justifyContent = elementStyle[`--${kebabCase(displayMode)}-align-items`];

    const onAddClick = () => {
        handler.trigger(
            new TogglePluginActionEvent({
                name: "pb-editor-toolbar-add-element",
                params: { id, path, type }
            })
        );
    };

    const dropElementAction = (source: DragObjectWithTypeWithTargetType, position: number) => {
        handler.trigger(
            new DropElementActionEvent({
                source,
                target: {
                    id,
                    type,
                    position
                }
            })
        );
    };

    const totalElements = elements.length;
    return (
        <div
            style={{ width: "100%", display: "flex" }}
            className={"webiny-pb-layout-block-container " + css(containerStyle as any)}
            {...elementAttributes}
        >
            <div
                style={{
                    width,
                    justifyContent,
                    alignItems
                }}
                className={combineClassNames(...customClasses)}
            >
                {totalElements === 0 && (
                    <DropZone.Center
                        id={id}
                        type={type}
                        onDrop={source => dropElementAction(source, 0)}
                    >
                        <IconButton
                            className={addIcon + " addIcon"}
                            icon={<AddCircleOutline />}
                            onClick={onAddClick}
                        />
                    </DropZone.Center>
                )}
                {elements.map((childId, index) => (
                    <BlockContainerInnerWrapStyled key={childId}>
                        <DropZone.Above
                            type={type}
                            onDrop={source => dropElementAction(source, index)}
                        />
                        <Element key={childId} id={childId} />
                        {index === totalElements - 1 && (
                            <DropZone.Below
                                type={type}
                                onDrop={source => dropElementAction(source, totalElements)}
                            />
                        )}
                    </BlockContainerInnerWrapStyled>
                ))}
            </div>
        </div>
    );
};

export default React.memo(BlockContainer);
