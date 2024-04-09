import React, { useMemo, useState } from "react";
import SliderWithInput from "./SliderWithInput";
import Footer from "./Footer";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { activeElementAtom, elementWithChildrenByIdSelector } from "../../../recoil/modules";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import get from "lodash/get";
import { set, merge } from "dot-prop-immutable";
import { ReactComponent as BorderOuterIcon } from "../../../assets/icons/border_outer.svg";
import { ReactComponent as BorderLeftIcon } from "../../../assets/icons/border_left.svg";
import { ReactComponent as BorderRightIcon } from "../../../assets/icons/border_right.svg";
import { ReactComponent as BorderTopIcon } from "../../../assets/icons/border_top.svg";
import { ReactComponent as BorderBottomIcon } from "../../../assets/icons/border_bottom.svg";
import { useRecoilValue } from "recoil";

interface UpdateSettingsCallable {
    (name: string, newValue: string | number, history: boolean): void;
}
interface HandlerUpdateCallable {
    (value: string): void;
}
/**
 * PMSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

interface PMSettingsPropsType {
    styleAttribute: string;
    // TODO check - not used anywhere
    title?: string;
}

const PMSettings = ({ styleAttribute }: PMSettingsPropsType) => {
    const handler = useEventActionHandler();

    const valueKey = `data.settings.${styleAttribute}`;
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));
    const advanced = get(element, `${valueKey}.advanced`, false);

    const [tabIndex, setTabIndex] = useState<number>(0);

    const updateSettings: UpdateSettingsCallable = (name, newValue, history = false) => {
        const propName = `${valueKey}.${name}`;

        if (name !== "advanced") {
            newValue = parseInt(newValue as string) || 0;
        }

        let newElement = set(element, propName, newValue);

        // Update all values in advanced settings
        if (propName.endsWith(".all")) {
            const prefix = propName.includes("desktop") ? "desktop" : "mobile";
            newElement = merge(newElement, `${valueKey}.${prefix}`, {
                top: newValue,
                right: newValue,
                bottom: newValue,
                left: newValue
            });
        }

        handler.trigger(
            new UpdateElementActionEvent({
                element: newElement,
                history
            })
        );
    };

    const getUpdateValue = useMemo(() => {
        const handlers: Record<string, HandlerUpdateCallable> = {};
        return (name: string) => {
            if (!handlers[name]) {
                handlers[name] = value => updateSettings(name, value, true);
            }

            return handlers[name];
        };
    }, [updateSettings]);

    const getUpdatePreview = useMemo(() => {
        const handlers: Record<string, HandlerUpdateCallable> = {};
        return (name: string) => {
            if (!handlers[name]) {
                handlers[name] = value => updateSettings(name, value, false);
            }

            return handlers[name];
        };
    }, [updateSettings]);

    return (
        <Tabs onActivate={setTabIndex}>
            <Tab label={"Desktop"}>
                {tabIndex === 0 && (
                    <>
                        {!advanced ? (
                            <SliderWithInput
                                className={"no-bottom-padding"}
                                icon={<BorderOuterIcon />}
                                valueKey={valueKey + ".desktop.all"}
                                updateValue={getUpdateValue("desktop.all")}
                                updatePreview={getUpdatePreview("desktop.all")}
                            />
                        ) : (
                            <React.Fragment>
                                <SliderWithInput
                                    icon={<BorderTopIcon />}
                                    valueKey={valueKey + ".desktop.top"}
                                    updateValue={getUpdateValue("desktop.top")}
                                    updatePreview={getUpdatePreview("desktop.top")}
                                />
                                <SliderWithInput
                                    icon={<BorderRightIcon />}
                                    valueKey={valueKey + ".desktop.right"}
                                    updateValue={getUpdateValue("desktop.right")}
                                    updatePreview={getUpdatePreview("desktop.right")}
                                />
                                <SliderWithInput
                                    icon={<BorderBottomIcon />}
                                    valueKey={valueKey + ".desktop.bottom"}
                                    updateValue={getUpdateValue("desktop.bottom")}
                                    updatePreview={getUpdatePreview("desktop.bottom")}
                                />
                                <SliderWithInput
                                    className={"no-bottom-padding"}
                                    icon={<BorderLeftIcon />}
                                    valueKey={valueKey + ".desktop.left"}
                                    updateValue={getUpdateValue("desktop.left")}
                                    updatePreview={getUpdatePreview("desktop.left")}
                                />
                            </React.Fragment>
                        )}
                    </>
                )}
                <Footer advanced={Boolean(advanced)} toggleAdvanced={getUpdateValue("advanced")} />
            </Tab>
            <Tab label={"Mobile"}>
                {tabIndex === 1 && (
                    <>
                        {!advanced ? (
                            <SliderWithInput
                                className={"no-bottom-padding"}
                                icon={<BorderOuterIcon />}
                                valueKey={valueKey + ".mobile.all"}
                                updateValue={getUpdateValue("mobile.all")}
                                updatePreview={getUpdatePreview("mobile.all")}
                            />
                        ) : (
                            <React.Fragment>
                                <SliderWithInput
                                    icon={<BorderTopIcon />}
                                    valueKey={valueKey + ".mobile.top"}
                                    updateValue={getUpdateValue("mobile.top")}
                                    updatePreview={getUpdatePreview("mobile.top")}
                                />
                                <SliderWithInput
                                    icon={<BorderRightIcon />}
                                    valueKey={valueKey + ".mobile.right"}
                                    updateValue={getUpdateValue("mobile.right")}
                                    updatePreview={getUpdatePreview("mobile.right")}
                                />
                                <SliderWithInput
                                    icon={<BorderBottomIcon />}
                                    valueKey={valueKey + ".mobile.bottom"}
                                    updateValue={getUpdateValue("mobile.bottom")}
                                    updatePreview={getUpdatePreview("mobile.bottom")}
                                />
                                <SliderWithInput
                                    className={"no-bottom-padding"}
                                    icon={<BorderLeftIcon />}
                                    valueKey={valueKey + ".mobile.left"}
                                    updateValue={getUpdateValue("mobile.left")}
                                    updatePreview={getUpdatePreview("mobile.left")}
                                />
                            </React.Fragment>
                        )}
                    </>
                )}
                <Footer advanced={Boolean(advanced)} toggleAdvanced={getUpdateValue("advanced")} />
            </Tab>
        </Tabs>
    );
};

export default React.memo(PMSettings);
