import React, { useMemo } from "react";
import get from "lodash/get";
import { useRecoilCallback } from "recoil";
import styled from "@emotion/styled";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { plugins } from "@webiny/plugins";
import { uiAtom } from "~/editor/recoil/modules";
import useUpdateHandlers from "~/editor/plugins/elementSettings/useUpdateHandlers";
import { applyFallbackDisplayMode } from "~/editor/plugins/elementSettings/elementSettingsUtils";
import { useDisplayMode } from "~/editor/hooks/useDisplayMode";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useElementById } from "~/editor/hooks/useElementById";
import {
    PbEditorElement,
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin
} from "~/types";
// Icons
import { ReactComponent as ArrowLeftIcon } from "@material-design-icons/svg/round/arrow_left.svg";
import { ReactComponent as ArrowUpIcon } from "@material-design-icons/svg/round/arrow_drop_up.svg";
import { ReactComponent as ArrowRightIcon } from "@material-design-icons/svg/round/arrow_right.svg";
import { ReactComponent as ArrowDownIcon } from "@material-design-icons/svg/round/arrow_drop_down.svg";
import { ReactComponent as CircleIcon } from "@material-design-icons/svg/filled/circle.svg";
// Components
import {
    COLORS,
    Top,
    Left,
    Right,
    Bottom
} from "~/editor/plugins/elementSettings/components/StyledComponents";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import InputField from "~/editor/plugins/elementSettings/components/InputField";

const SpacingGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 84px 1fr;
    grid-template-rows: 1fr 84px 1fr;
    gap: 12px 12px;
    grid-template-areas:
        ". top ."
        "left center right"
        ". bottom .";
    align-items: center;

    & .text {
        font-size: 11;
        padding: 4px 8px;
    }
    & .mono {
        font-family: monospace;
    }
`;

const Center = styled.div`
    grid-area: center;
    display: grid;
    grid-template-columns: 1fr 30px 1fr;
    grid-template-rows: 1fr 30px 1fr;
    gap: 0px 0px;
    grid-template-areas:
        ". top ."
        "left center right"
        ". bottom .";
    padding: 2px;
    background-color: ${COLORS.lightGray};
    border: 1px solid var(--mdc-theme-on-background);

    & .mdc-icon-button {
        padding: 0;
        width: 24px;
        height: 24px;
    }

    & .align-center {
        display: flex;
        justify-content: center;
        align-items: center;
    }
`;

const InnerCenter = styled.div`
    grid-area: center;

    button {
        display: flex;
        justify-content: center;
        align-items: center;

        svg {
            width: 12px;
            height: 12px;
        }
    }
`;

const IconButtonStyled = styled(IconButton)<{ isActive: boolean }>`
    color: ${props => (props.isActive ? "var(--mdc-theme-primary)" : COLORS.darkGray)};
`;

const InputWrapper = styled.div`
    position: relative;

    input {
        padding-right: 28px;
    }

    span {
        position: absolute;
        right: 8px;
        top: 6px;
        color: ${COLORS.darkGray};
    }
`;

type ValueInputProps = {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
};

const ValueInput: React.FC<ValueInputProps> = ({ value, onChange, disabled }) => {
    return (
        <InputWrapper>
            <InputField
                type="number"
                value={typeof value === "string" ? value : ""}
                onChange={onChange}
                onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                    if (event.target.value === "") {
                        onChange("0");
                    }
                }}
                disabled={disabled}
            />
            <Typography use="body2">px</Typography>
        </InputWrapper>
    );
};

const DATA_NAMESPACE = "data.settings.position";
const SIDES = ["top", "right", "bottom", "left"];

const PositionSettings: React.FC<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const { displayMode } = useDisplayMode();
    const parentPropName = `data.settings.cellSettings.${displayMode}.absolutePositioning`;
    const [element] = useActiveElement<PbEditorElement>();
    const [parentElement] = useElementById(element?.parent || null);

    const parentFallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(parentElement, `data.settings.cellSettings.${mode}.absolutePositioning`)
            ),
        [displayMode, parentElement]
    );
    const parentAbsolutePositioning = get(
        parentElement,
        parentPropName,
        parentFallbackValue || false
    );

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const memoizedResponsiveModePlugin = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const { config: activeEditorModeConfig } = memoizedResponsiveModePlugin || {
        config: {
            displayMode: null,
            icon: null
        }
    };

    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    const updateValueTop = useRecoilCallback(({ snapshot }) => async value => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        getUpdateValue(`${displayMode}.top`)(value);
    });

    const updateValueRight = useRecoilCallback(({ snapshot }) => async value => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        getUpdateValue(`${displayMode}.right`)(value);
    });

    const updateValueBottom = useRecoilCallback(({ snapshot }) => async value => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        getUpdateValue(`${displayMode}.bottom`)(value);
    });

    const updateValueLeft = useRecoilCallback(({ snapshot }) => async value => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        getUpdateValue(`${displayMode}.left`)(value);
    });

    const updateStatusTop = useRecoilCallback(({ snapshot }) => async isActive => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        if (isActive) {
            getUpdateValue(displayMode)({
                top: "0",
                bottom: null
            });
        } else {
            getUpdateValue(displayMode)({
                top: null
            });
        }
    });

    const updateStatusRight = useRecoilCallback(({ snapshot }) => async isActive => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        if (isActive) {
            getUpdateValue(displayMode)({
                right: "0",
                left: null
            });
        } else {
            getUpdateValue(displayMode)({
                right: null
            });
        }
    });

    const updateStatusBottom = useRecoilCallback(({ snapshot }) => async isActive => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        if (isActive) {
            getUpdateValue(displayMode)({
                top: null,
                bottom: "0"
            });
        } else {
            getUpdateValue(displayMode)({
                bottom: null
            });
        }
    });

    const updateStatusLeft = useRecoilCallback(({ snapshot }) => async isActive => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        if (isActive) {
            getUpdateValue(displayMode)({
                right: null,
                left: "0"
            });
        } else {
            getUpdateValue(displayMode)({
                left: null
            });
        }
    });

    const isCenterActive =
        typeof get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue) === "string";

    const [top, right, bottom, left] = useMemo(() => {
        return SIDES.map(side => {
            if (isCenterActive) {
                return null;
            }

            return get(
                element,
                `${DATA_NAMESPACE}.${displayMode}.${side}`,
                get(fallbackValue, side)
            );
        });
    }, [element, displayMode, fallbackValue, isCenterActive]);

    const isTopActive = typeof top === "string";
    const isRightActive = typeof right === "string";
    const isBottomActive = typeof bottom === "string";
    const isLeftActive = typeof left === "string";

    const updateCenterStatus = useRecoilCallback(({ snapshot }) => async value => {
        const { displayMode } = await snapshot.getPromise(uiAtom);
        if (value) {
            getUpdateValue(displayMode)("centered");
        } else {
            getUpdateValue(displayMode)({});
        }
    });

    if (parentElement?.type !== "cell" || !parentAbsolutePositioning) {
        return null;
    }

    return (
        <Accordion
            title={"Position"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeEditorModeConfig.displayMode}`}>
                    {activeEditorModeConfig.icon}
                </Tooltip>
            }
        >
            <SpacingGrid>
                <Top>
                    <ValueInput value={top} onChange={updateValueTop} disabled={!isTopActive} />
                </Top>
                <Left>
                    <ValueInput value={left} onChange={updateValueLeft} disabled={!isLeftActive} />
                </Left>
                <Center>
                    <Top className="align-center">
                        <IconButtonStyled
                            isActive={isTopActive}
                            icon={<ArrowUpIcon />}
                            onClick={() => updateStatusTop(!isTopActive)}
                        />
                    </Top>
                    <Left className="align-center">
                        <IconButtonStyled
                            isActive={isLeftActive}
                            icon={<ArrowLeftIcon />}
                            onClick={() => updateStatusLeft(!isLeftActive)}
                        />
                    </Left>
                    <InnerCenter className="align-center">
                        <IconButtonStyled
                            isActive={isCenterActive}
                            icon={<CircleIcon />}
                            onClick={() => updateCenterStatus(!isCenterActive)}
                        />
                    </InnerCenter>
                    <Right className="align-center">
                        <IconButtonStyled
                            isActive={isRightActive}
                            icon={<ArrowRightIcon />}
                            onClick={() => updateStatusRight(!isRightActive)}
                        />
                    </Right>
                    <Bottom className="align-center">
                        <IconButtonStyled
                            isActive={isBottomActive}
                            icon={<ArrowDownIcon />}
                            onClick={() => updateStatusBottom(!isBottomActive)}
                        />
                    </Bottom>
                </Center>
                <Right>
                    <ValueInput
                        value={right}
                        onChange={updateValueRight}
                        disabled={!isRightActive}
                    />
                </Right>
                <Bottom>
                    <ValueInput
                        value={bottom}
                        onChange={updateValueBottom}
                        disabled={!isBottomActive}
                    />
                </Bottom>
            </SpacingGrid>
        </Accordion>
    );
};

export default React.memo(PositionSettings);
