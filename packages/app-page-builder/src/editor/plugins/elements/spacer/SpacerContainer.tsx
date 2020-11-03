import React, { useState } from "react";
import Resizer from "@webiny/app-page-builder/editor/components/Resizer";
import styled from "@emotion/styled";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import {
    ResizeEndActionEvent,
    ResizeStartActionEvent,
    UpdateElementActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import { elementWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { css } from "emotion";
import { useRecoilValue } from "recoil";

const SpacerHandle = styled("div")({
    height: "100%",
    width: "100%",
    position: "absolute",
    left: 0,
    bottom: -8
});

const SpacerHeight = styled("div")({
    position: "absolute",
    width: 50,
    top: "calc(50% - 12px)",
    left: "calc(50% - 25px)",
    color: "white",
    fontSize: 12,
    padding: 5,
    borderRadius: 5
});

export const MIN_HEIGHT = 20;
export const INIT_HEIGHT = 100;

type SpacerContainerPropsType = {
    elementId: string;
    elementStyle: any;
    customClasses: any;
    combineClassNames: any;
};
const SpacerContainer: React.FunctionComponent<SpacerContainerPropsType> = ({
    elementId,
    elementStyle,
    customClasses,
    combineClassNames
}) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(elementWithChildrenByIdSelector(elementId));
    const elementHeight = element.data?.settings?.height?.value || MIN_HEIGHT;

    const [localHeight, setHeight] = useState<number>(null);
    const { initialHeight = MIN_HEIGHT, ...spacerStyle } = elementStyle;
    let height = initialHeight;
    if (localHeight) {
        height = localHeight;
    }

    const onResizeStart = () => {
        handler.trigger(new ResizeStartActionEvent());
        setHeight(elementHeight);
    };

    const onResizeStop = () => {
        handler.trigger(new ResizeEndActionEvent());
        handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...element.data.settings,
                            height: {
                                ...element.data.settings.height,
                                value: MIN_HEIGHT
                            }
                        }
                    }
                }
            })
        );
        setHeight(null);
    };
    const onResize = (diff: number) => {
        setHeight(Math.max(MIN_HEIGHT, localHeight - diff));
    };

    return (
        <div style={{ height }} className={combineClassNames(css(spacerStyle), ...customClasses)}>
            <Resizer
                axis={"y"}
                onResizeStart={onResizeStart}
                onResizeStop={onResizeStop}
                onResize={onResize}
            >
                {({ ...otherProps }) => (
                    <React.Fragment>
                        <SpacerHeight>
                            {height}
                            px
                        </SpacerHeight>

                        <SpacerHandle {...otherProps} />
                    </React.Fragment>
                )}
            </Resizer>
        </div>
    );
};

export default React.memo(SpacerContainer);
