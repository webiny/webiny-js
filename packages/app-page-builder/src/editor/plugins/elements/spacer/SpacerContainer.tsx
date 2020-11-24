import React, { useState } from "react";
import Resizer from "@webiny/app-page-builder/editor/components/Resizer";
import styled from "@emotion/styled";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import {
    ResizeEndActionEvent,
    ResizeStartActionEvent
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
    const { initialHeight = MIN_HEIGHT, ...spacerStyle } = elementStyle;
    const [localHeight, setLocalHeight] = useState<number>(
        element?.data?.settings?.height?.value || initialHeight
    );
    if (!element) {
        return null;
    }

    const onResizeStart = (height: number) => {
        handler.trigger(new ResizeStartActionEvent());
        setLocalHeight(height);
    };

    const onResizeStop = (height: number) => {
        handler.trigger(
            new ResizeEndActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...(element.data?.settings || {}),
                            height: {
                                ...(element.data?.settings?.height || {}),
                                value: height
                            }
                        }
                    }
                }
            })
        );
    };
    const onResize = (diff: number) => {
        setLocalHeight(previousHeight => {
            return Math.max(MIN_HEIGHT, previousHeight - diff);
        });
    };

    return (
        <div
            style={{ height: localHeight }}
            className={combineClassNames(css(spacerStyle), ...customClasses)}
        >
            <Resizer
                axis={"y"}
                onResizeStart={() => onResizeStart(localHeight)}
                onResizeStop={() => onResizeStop(localHeight)}
                onResize={onResize}
            >
                {({ ...otherProps }) => (
                    <React.Fragment>
                        <SpacerHeight>
                            {localHeight}
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
