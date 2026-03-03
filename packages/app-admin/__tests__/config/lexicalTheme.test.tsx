import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, act } from "@testing-library/react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { Properties, toObject } from "@webiny/react-properties";

const getLastCall = (fn: any) => {
    const calls = fn.mock.calls;
    return calls[calls.length - 1][0];
};

async function flush() {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
    });
}

const { LexicalTheme } = AdminConfig;

describe("LexicalTheme Config", () => {
    it("should create colors configuration", async () => {
        const onChange = vi.fn();

        render(
            <Properties onChange={onChange}>
                <LexicalTheme.Color id="color1" label={"Color 1"} value="var(--wb-theme-color1)" />
                <LexicalTheme.Color id="color2" label={"Color 2"} value="#666666" />
            </Properties>
        );
        await flush();

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            lexicalTheme: {
                colors: [
                    {
                        id: "color1",
                        label: "Color 1",
                        value: "var(--wb-theme-color1)"
                    },
                    {
                        id: "color2",
                        label: "Color 2",
                        value: "#666666"
                    }
                ]
            }
        });
    });

    it("should create typography configuration with headings", async () => {
        const onChange = vi.fn();

        render(
            <Properties onChange={onChange}>
                <LexicalTheme.Typography.Heading
                    id="heading1"
                    label={"Heading 1"}
                    tag="h1"
                    className="wb-heading-1"
                />
                <LexicalTheme.Typography.Heading
                    id="heading2"
                    label={"Heading 2"}
                    tag="h2"
                    className="wb-heading-2"
                />
            </Properties>
        );
        await flush();

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            lexicalTheme: {
                typography: {
                    headings: [
                        {
                            id: "heading1",
                            label: "Heading 1",
                            tag: "h1",
                            className: "wb-heading-1"
                        },
                        {
                            id: "heading2",
                            label: "Heading 2",
                            tag: "h2",
                            className: "wb-heading-2"
                        }
                    ]
                }
            }
        });
    });

    it("should create complete theme configuration", async () => {
        const onChange = vi.fn();

        render(
            <Properties onChange={onChange}>
                {/* Colors */}
                <LexicalTheme.Color id="color1" label={"Color 1"} value="var(--wb-theme-color1)" />
                <LexicalTheme.Color id="color2" label={"Color 2"} value="#666666" />

                {/* Headings */}
                <LexicalTheme.Typography.Heading
                    id="heading1"
                    label="Heading 1"
                    tag="h1"
                    className="wb-heading-1"
                />
                <LexicalTheme.Typography.Heading
                    id="heading2"
                    label="Heading 2"
                    tag="h2"
                    className="wb-heading-2"
                />

                {/* Paragraphs */}
                <LexicalTheme.Typography.Paragraph
                    id="paragraph1"
                    label="Paragraph 1"
                    tag="p"
                    className="wb-paragraph-1"
                />

                {/* Quotes */}
                <LexicalTheme.Typography.Quote
                    id="quote"
                    label="Quote"
                    tag="blockquote"
                    className="wb-blockquote-1"
                />

                {/* Lists */}
                <LexicalTheme.Typography.List
                    id="list1"
                    label="List 1"
                    tag="ul"
                    className="wb-unordered-list-1"
                />
            </Properties>
        );
        await flush();

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            lexicalTheme: {
                colors: [
                    {
                        id: "color1",
                        label: "Color 1",
                        value: "var(--wb-theme-color1)"
                    },
                    {
                        id: "color2",
                        label: "Color 2",
                        value: "#666666"
                    }
                ],
                typography: {
                    headings: [
                        {
                            id: "heading1",
                            label: "Heading 1",
                            tag: "h1",
                            className: "wb-heading-1"
                        },
                        {
                            id: "heading2",
                            label: "Heading 2",
                            tag: "h2",
                            className: "wb-heading-2"
                        }
                    ],
                    paragraphs: [
                        {
                            id: "paragraph1",
                            label: "Paragraph 1",
                            tag: "p",
                            className: "wb-paragraph-1"
                        }
                    ],
                    quotes: [
                        {
                            id: "quote",
                            label: "Quote",
                            tag: "blockquote",
                            className: "wb-blockquote-1"
                        }
                    ],
                    lists: [
                        {
                            id: "list1",
                            label: "List 1",
                            tag: "ul",
                            className: "wb-unordered-list-1"
                        }
                    ]
                }
            }
        });
    });

    it("should support removing colors", async () => {
        const onChange = vi.fn();

        render(
            <Properties onChange={onChange}>
                <LexicalTheme.Color id="color1" label={"Color 1"} value="var(--wb-theme-color1)" />
                <LexicalTheme.Color id="color2" label={"Color 2"} value="#666666" />
                <LexicalTheme.Color id="color1" remove />
            </Properties>
        );
        await flush();

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            lexicalTheme: {
                colors: [
                    {
                        id: "color2",
                        label: "Color 2",
                        value: "#666666"
                    }
                ]
            }
        });
    });

    it("should support reordering typography items", async () => {
        const onChange = vi.fn();

        render(
            <Properties onChange={onChange}>
                <LexicalTheme.Typography.Heading
                    id="heading1"
                    label="Heading 1"
                    tag="h1"
                    className="wb-heading-1"
                />
                <LexicalTheme.Typography.Heading
                    id="heading2"
                    label="Heading 2"
                    tag="h2"
                    className="wb-heading-2"
                    before={"heading1"}
                />
                <LexicalTheme.Typography.Heading
                    id="heading3"
                    label="Heading 3"
                    tag="h3"
                    className="wb-heading-3"
                    after="heading2"
                />
            </Properties>
        );
        await flush();

        const properties = getLastCall(onChange);
        const result = toObject(properties);

        expect(result).toEqual({
            lexicalTheme: {
                typography: {
                    headings: [
                        {
                            id: "heading2",
                            label: "Heading 2",
                            tag: "h2",
                            className: "wb-heading-2"
                        },
                        {
                            id: "heading3",
                            label: "Heading 3",
                            tag: "h3",
                            className: "wb-heading-3"
                        },
                        {
                            id: "heading1",
                            label: "Heading 1",
                            tag: "h1",
                            className: "wb-heading-1"
                        }
                    ]
                }
            }
        });
    });
});
