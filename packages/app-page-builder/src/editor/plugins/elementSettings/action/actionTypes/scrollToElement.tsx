import React, { useEffect, useState } from "react";
import { css } from "emotion";
import { Bind } from "@webiny/form";
import { PbEditorElement, PbElement, PbPageElementActionTypePlugin } from "~/types";
import Wrapper from "../../components/Wrapper";
import SelectField from "../../components/SelectField";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { getElementsPropertiesValues } from "~/render/utils";
import { withActiveElement } from "~/editor/components";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

const ScrollToElementForm = withActiveElement()(({ element }: { element: PbEditorElement }) => {
    const { getElementTree } = useEventActionHandler();
    const [elementIds, setElementIds] = useState<Array<string>>([""]);

    const actionType = element.data.action?.actionType;

    useEffect(() => {
        const getElementIds = async () => {
            const tree = (await getElementTree()) as PbElement;
            setElementIds(getElementsPropertiesValues(tree, "data.settings.property.id"));
        };

        if (actionType === "scrollToElement") {
            getElementIds();
        }
    }, [actionType]);

    return (
        <>
            <Bind name={"scrollToElement"}>
                {({ value, onChange }) => (
                    <Wrapper label={"Element ID"} containerClassName={classes.gridClass}>
                        <SelectField value={value} onChange={onChange} placeholder={"None"}>
                            {elementIds.map((item, index) => (
                                <option key={index} value={item}>
                                    {item}
                                </option>
                            ))}
                        </SelectField>
                    </Wrapper>
                )}
            </Bind>
        </>
    );
});

export const scrollToElementActionType: PbPageElementActionTypePlugin = {
    type: "pb-page-element-action-type",
    actionType: {
        name: "scrollToElement",
        label: "Scroll to element",
        element: <ScrollToElementForm />
    }
};
