import React, { useMemo, useCallback } from "react";
import { useRecoilValue } from "recoil";

import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import { css } from "emotion";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

const ImageSettings = () => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(activeElementSelector);
    const {
        id,
        data: { image }
    } = element;

    const setData = useMemo(() => {
        const historyUpdated = {};
        return (name, value) => {
            if (historyUpdated[name] === value) {
                return;
            }
            historyUpdated[name] = value;
            handler.trigger(
                new UpdateElementActionEvent({
                    element: {
                        ...element,
                        elements: [],
                        data: {
                            ...element.data,
                            image: {
                                ...(element.data.image || {}),
                                [name]: value
                            }
                        }
                    }
                })
            );
        };
    }, [id, image]);

    const updateTitle = useCallback(value => setData("title", value), [id, image]);
    const updateWidth = useCallback(value => setData("width", value), [id, image]);
    const updateHeight = useCallback(value => setData("height", value), [id, image]);

    return (
        <Accordion title={"Image"}>
            <>
                <Wrapper containerClassName={classes.grid} label={"Title"}>
                    <InputField value={image?.title || ""} onChange={updateTitle} />
                </Wrapper>
                <Wrapper containerClassName={classes.grid} label={"Width"}>
                    <InputField
                        placeholder={"auto"}
                        value={image?.width || ""}
                        onChange={updateWidth}
                    />
                </Wrapper>
                <Wrapper containerClassName={classes.grid} label={"Height"}>
                    <InputField
                        placeholder={"auto"}
                        value={image?.height || ""}
                        onChange={updateHeight}
                    />
                </Wrapper>
            </>
        </Accordion>
    );
};
export default React.memo(ImageSettings);
