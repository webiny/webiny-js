//@flow
import React, { useCallback } from "react";
import styled from "react-emotion";
import { isEqual } from "lodash";
import { css } from "emotion";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { IconButton } from "@webiny/ui/Button";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import DropZone from "@webiny/app-page-builder/editor/components/DropZone";
import ConnectedElement from "@webiny/app-page-builder/editor/components/ConnectedElement";
import { ReactComponent as AddCircleOutline } from "@webiny/app-page-builder/editor/assets/icons/baseline-add_circle-24px.svg";
import { dropElement, togglePlugin } from "@webiny/app-page-builder/editor/actions";
import { getElement } from "@webiny/app-page-builder/editor/selectors";
import ColumnChild from "./ColumnChild";
import ElementAnimation from "@webiny/app-page-builder/render/components/ElementAnimation";

const ColumnContainer = styled("div")({
    position: "relative",
    flex: "1 100%",
    boxSizing: "border-box",
    height: "100%",
    width: "100%",
    zIndex: 20,
    display: "flex"
});

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

const Column = React.memo(props => {
    const { element } = props;

    const onClick = useHandler(props, ({ element, togglePlugin }) => () => {
        const { id, path, type } = element;
        togglePlugin({
            name: "pb-editor-toolbar-add-element",
            params: { id, path, type }
        });
    });

    const onDrop = useHandler(props, ({ element, dropElement }) => source => {
        const { id, path, type } = element;
        dropElement({ source, target: { id, path, type, position: null } });
    });

    return (
        <ElementAnimation>
            <ColumnContainer style={{ justifyContent: "center" }}>
                <ElementRoot
                    element={element}
                    className={"webiny-pb-base-page-element-style webiny-pb-layout-column"}
                    style={{ width: "100%", display: "flex", flexDirection: "column" }}
                >
                    <ConnectedElement elementId={element.id}>
                        {({ id, path, type, elements }) => (
                            <React.Fragment>
                                {!elements.length && (
                                    <DropZone.Center key={id} id={id} type={type} onDrop={onDrop}>
                                        <IconButton
                                            className={addIcon + " addIcon"}
                                            icon={<AddCircleOutline />}
                                            onClick={onClick}
                                        />
                                    </DropZone.Center>
                                )}
                                {elements.map((childId, index) => (
                                    <ColumnChild
                                        key={childId}
                                        id={childId}
                                        index={index}
                                        count={elements.length}
                                        last={index === elements.length - 1}
                                        target={{ id, path, type }}
                                    />
                                ))}
                            </React.Fragment>
                        )}
                    </ConnectedElement>
                </ElementRoot>
            </ColumnContainer>
        </ElementAnimation>
    );
});

export default connect(
    (state, props) => {
        const element = getElement(state, props.element.id);
        return {
            // $FlowFixMe
            element: { ...element, elements: element.elements.map(id => getElement(state, id)) }
        };
    },
    { dropElement, togglePlugin },
    null,
    { areStatePropsEqual: isEqual }
)(Column);
