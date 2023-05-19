import React from "react";
import styled from "@emotion/styled";
import { BindComponent } from "@webiny/form/types";
import { BlockVariantSelector } from "~/components/preparation/BlockVariantSelector";

const BlockVariantSettingsWrapper = styled.div`
    display: grid;
    row-gap: 24px;
    padding: 16px;
`;

type BlockVariantSettingsProps = {
    Bind: BindComponent;
    submit: () => void;
    data: Record<string, any>;
};

export const BlockVariantSettings: React.FC<BlockVariantSettingsProps> = ({ Bind, submit }) => {
    return (
        <BlockVariantSettingsWrapper>
            <Bind name={"dynamicSource.variant"} afterChange={submit}>
                {({ onChange }) => (
                    <BlockVariantSelector
                        sourceModelId={"blog"}
                        value={{
                            variants: [
                                {
                                    id: "variantA",
                                    label: "Variant A",
                                    conditions: [
                                        {
                                            field: {
                                                id: "title",
                                                label: "Title",
                                                type: "text",
                                                path: "blog.title"
                                            },
                                            condition: "equals",
                                            value: "123"
                                        }
                                    ]
                                },
                                {
                                    id: "variantB",
                                    label: "Variant B",
                                    conditions: [
                                        {
                                            field: {
                                                id: "title",
                                                label: "Title",
                                                type: "text",
                                                path: "blog.title"
                                            },
                                            condition: "equals",
                                            value: "123"
                                        },
                                        {
                                            field: {
                                                id: "title",
                                                label: "Title",
                                                type: "text",
                                                path: "blog.title"
                                            },
                                            condition: "equals",
                                            value: "123"
                                        }
                                    ]
                                }
                            ],
                            selectedId: "variantA"
                        }}
                        onChange={value => onChange(value)}
                    />
                )}
            </Bind>
        </BlockVariantSettingsWrapper>
    );
};
