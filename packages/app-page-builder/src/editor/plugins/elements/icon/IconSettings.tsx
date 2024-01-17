import React, { useEffect, useRef, useState } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
// Components
import { IconPicker } from "@webiny/app-admin/components/IconPicker";
import { ICON_PICKER_SIZE } from "@webiny/app-admin/components/IconPicker/types";
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import InputField from "../../elementSettings/components/InputField";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import { replaceFullIconObject } from "../utils/iconUtils";
import { activeElementAtom, elementWithChildrenByIdSelector } from "~/editor/recoil/modules";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    widthInputStyle: css({
        maxWidth: 60
    }),
    rightCellStyle: css({
        justifySelf: "end"
    })
};

const IconSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as PbEditorElement;
    const { data: { icon = {} } = {} } = element;

    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: "data",
        postModifyElement: replaceFullIconObject
    });

    const iconRef = useRef<HTMLDivElement>(null);
    const [iconValue, setIconValue] = useState(icon.value);
    const [iconWidth, setIconWidth] = useState(icon.width);

    useEffect(() => {
        setIconValue(icon.value);
        setIconWidth(icon.width);
    }, [element.id]);

    useEffect(() => {
        if (!iconRef.current) {
            return;
        }

        const markup = iconRef.current.innerHTML;

        if (icon.value?.markup !== markup) {
            getUpdateValue("icon")({ value: { ...iconValue, markup }, width: iconWidth });
        }
    }, [iconValue, iconWidth]);

    return (
        <Accordion title={"Icon"} defaultValue={defaultAccordionValue}>
            <>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Icon"}
                    rightCellClassName={classes.rightCellStyle}
                >
                    <IconPicker
                        size={ICON_PICKER_SIZE.SMALL}
                        value={iconValue}
                        onChange={setIconValue}
                    />
                </Wrapper>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Width"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                    rightCellClassName={classes.rightCellStyle}
                >
                    <InputField
                        className={classes.widthInputStyle}
                        value={iconWidth}
                        onChange={value => {
                            setIconWidth(value === "" ? undefined : Number(value));
                        }}
                        placeholder="50"
                    />
                </Wrapper>
                {/* Renders IconPicker.Icon for accessing its HTML without displaying it. */}
                <div style={{ display: "none" }} ref={iconRef}>
                    <IconPicker.Icon icon={iconValue} size={iconWidth} />
                </div>
            </>
        </Accordion>
    );
};

export default React.memo(IconSettings);
