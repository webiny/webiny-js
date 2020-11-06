import React, { useMemo, useState } from "react";
import SliderWithInput from "./SliderWithInput";
import Footer from "./Footer";
import { useApolloClient } from "react-apollo";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { get } from "lodash";
import { set, merge } from "dot-prop-immutable";
import { ReactComponent as BorderOuterIcon } from "@webiny/app-page-builder/editor/assets/icons/border_outer.svg";
import { ReactComponent as BorderLeftIcon } from "@webiny/app-page-builder/editor/assets/icons/border_left.svg";
import { ReactComponent as BorderRightIcon } from "@webiny/app-page-builder/editor/assets/icons/border_right.svg";
import { ReactComponent as BorderTopIcon } from "@webiny/app-page-builder/editor/assets/icons/border_top.svg";
import { ReactComponent as BorderBottomIcon } from "@webiny/app-page-builder/editor/assets/icons/border_bottom.svg";
import { useRecoilValue } from "recoil";

/**
 * PMSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

type PMSettingsPropsType = {
    styleAttribute: string;
    // TODO check - not used anywhere
    title?: string;
};

const PMSettings: React.FunctionComponent<PMSettingsPropsType> = ({ styleAttribute }) => {
    const handler = useEventActionHandler();
    const apolloClient = useApolloClient();

    const valueKey = `data.settings.${styleAttribute}`;
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const advanced = get(element, `${valueKey}.advanced`, false);

    const [tabIndex, setTabIndex] = useState<number>(0);

    const updateSettings = (name: string, newValue: any, history = false) => {
        const propName = `${valueKey}.${name}`;

        if (name !== "advanced") {
            newValue = parseInt(newValue) || 0;
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
                history,
                merge: true,
                client: apolloClient
            })
        );
    };

    const getUpdateValue = useMemo(() => {
        const handlers = {};
        return (name: string) => {
            if (!handlers[name]) {
                handlers[name] = value => updateSettings(name, value, true);
            }

            return handlers[name];
        };
    }, [updateSettings]);

    const getUpdatePreview = useMemo(() => {
        const handlers = {};
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
