import React from "react";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import PinterestEmbed from "./PinterestEmbed";
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

const PreviewBox = styled("div")({
    textAlign: "center",
    height: 50,
    svg: {
        height: 50,
        width: 50
    }
});

export default () => [
    createEmbedPlugin({
        type: "pinterest",
        toolbar: {
            title: "Pinterest post",
            group: "pb-editor-element-group-social",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
            }
        },
        render({ element }) {
            return <PinterestEmbed element={element} />;
        }
    }),
    createEmbedSettingsPlugin({
        type: "pinterest",
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
                                {({ value, onChange }) => (
                                    <InputField
                                        value={value}
                                        onChange={onChange}
                                        placeholder={
                                            "https://pinterest.com/pin/823666219335767857/"
                                        }
                                        description={"Enter a Pinterest URL"}
                                    />
                                )}
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
