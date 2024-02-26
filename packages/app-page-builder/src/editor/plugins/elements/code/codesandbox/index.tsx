import React from "react";
import styled from "@emotion/styled";
import { validation } from "@webiny/validation";
import { Typography } from "@webiny/ui/Typography";
import {
    createEmbedPlugin,
    createEmbedSettingsPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import { ReactComponent as LogoIcon } from "./codesandbox-logo.svg";
import Accordion from "../../../elementSettings/components/Accordion";
import InputField from "../../../elementSettings/components/InputField";
import {
    ButtonContainer,
    SimpleButton
} from "../../../elementSettings/components/StyledComponents";

import { PeCodesandbox } from "./PeCodesandbox";

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
        type: "codesandbox",
        toolbar: {
            title: "CodeSandbox",
            group: "pb-editor-element-group-code",
            preview() {
                return (
                    <PreviewBox>
                        <LogoIcon />
                    </PreviewBox>
                );
            }
        },
        oembed: {
            onData(data) {
                data["html"] = data["html"].replace(/1000px/g, "100%").replace(/1000/g, "100%");
                return data;
            }
        },
        render: params => {
            // @ts-expect-error No need to worry about different element.elements type.
            return <PeCodesandbox {...params} />;
        }
    }),
    createEmbedSettingsPlugin({
        type: "codesandbox",
        render({ Bind, submit }) {
            return (
                <Accordion title={"CodeSandbox"} defaultValue={true}>
                    <>
                        <Bind name={"source.url"} validators={validation.create("required,url")}>
                            <InputField
                                placeholder={"https://codesandbox.io/"}
                                description={"Enter a CodeSandbox URL"}
                            />
                        </Bind>
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
