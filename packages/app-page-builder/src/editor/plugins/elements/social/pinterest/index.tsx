import React from "react";
import styled from "@emotion/styled";
import kebabCase from "lodash/kebabCase";
import { Typography } from "@webiny/ui/Typography";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "../../utils/oembed";
import { validation } from "@webiny/validation";
import { ReactComponent as LogoIcon } from "./pinterest-brands.svg";
import Accordion from "../../../elementSettings/components/Accordion";
import Wrapper from "../../../elementSettings/components/Wrapper";
import InputField from "../../../elementSettings/components/InputField";
import SelectField from "../../../elementSettings/components/SelectField";
import {
    ButtonContainer,
    SimpleButton,
    classes
} from "../../../elementSettings/components/StyledComponents";
import { PbEditorElementPluginArgs } from "~/types";

import { PePinterest } from "~/editor/plugins/elements/social/pinterest/PePinterest";

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default (args: PbEditorElementPluginArgs = {}) => {
    const elementType = kebabCase(args.elementType || "pinterest");
    const defaultToolbar = {
        title: "Pinterest post",
        group: "pb-editor-element-group-social",
        preview() {
            return (
                <PreviewBox>
                    <LogoIcon />
                </PreviewBox>
            );
        }
    };

    return [
        createEmbedPlugin({
            type: elementType,
            /**
             * TODO @ts-refactor @ashutosh
             * Completely different types between method result and variable
             */
            // @ts-expect-error
            toolbar:
                typeof args.toolbar === "function" ? args.toolbar(defaultToolbar) : defaultToolbar,
            create: args.create,
            // @ts-expect-error
            settings: args.settings,
            render(props) {
                // @ts-expect-error No need to worry about different `element.elements` type.
                return <PePinterest {...props} />;
            }
        }),
        createEmbedSettingsPlugin({
            type: elementType,
            render({ Bind, submit }) {
                return (
                    <Accordion title={"Pinterest"} defaultValue={true}>
                        <>
                            <Wrapper
                                label={"URL"}
                                containerClassName={classes.simpleGrid}
                                leftCellSpan={3}
                                rightCellSpan={9}
                            >
                                <Bind
                                    name={"source.url"}
                                    validators={validation.create("required,url")}
                                >
                                    <InputField
                                        placeholder={
                                            "https://pinterest.com/pin/823666219335767857/"
                                        }
                                        description={"Enter a Pinterest URL"}
                                    />
                                </Bind>
                            </Wrapper>
                            <Wrapper
                                label={"Size"}
                                containerClassName={classes.simpleGrid}
                                leftCellSpan={3}
                                rightCellSpan={9}
                            >
                                <Bind defaultValue="small" name={"source.size"}>
                                    {({ value, onChange }) => (
                                        <SelectField value={value} onChange={onChange}>
                                            <option value="small">Small</option>
                                            <option value="medium">Medium</option>
                                            <option value="large">Large</option>
                                        </SelectField>
                                    )}
                                </Bind>
                            </Wrapper>
                            <ButtonContainer>
                                <SimpleButton onClick={submit}>
                                    <Typography use={"caption"}>Save</Typography>
                                </SimpleButton>
                            </ButtonContainer>
                        </>
                    </Accordion>
                );
            }
        })
    ];
};
