/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { CompositionProvider } from "@webiny/react-composition";
import { Property, toObject } from "~/index";
import { PageSettingsView, PageSettingsConfig } from "./PbEditorSettingsView";
import { getLastCall } from "~tests/utils";

const { SettingsGroup, FormField } = PageSettingsConfig;

const BaseConfig = () => {
    return (
        <>
            <PageSettingsConfig>
                <SettingsGroup name={"general"} title={"General Settings"} icon={"cog"}>
                    <FormField name={"title"} label={"Title"} component={"input"} />
                    <FormField name={"snippet"} label={"Snippet"} component={"textarea"} />
                    <FormField name={"layout"} label={"Layout"} component={"select"} />
                </SettingsGroup>
            </PageSettingsConfig>
        </>
    );
};

describe("PB Editor", () => {
    it("should contain 1 settings groups with 3 fields", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "General Settings",
                    icon: "cog",
                    fields: [
                        {
                            name: "title",
                            label: "Title",
                            component: expect.anything()
                        },
                        {
                            name: "snippet",
                            label: "Snippet",
                            component: expect.anything()
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });

    it("should contain a new settings group with 1 field", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"social"} title={"Social Media"} icon={"like"}>
                        <FormField name={"ogImage"} label={"OG Image"} component={"input"} />
                    </SettingsGroup>
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "General Settings",
                    icon: "cog",
                    fields: [
                        {
                            name: "title",
                            label: "Title",
                            component: expect.anything()
                        },
                        {
                            name: "snippet",
                            label: "Snippet",
                            component: expect.anything()
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                },
                {
                    name: "social",
                    title: "Social Media",
                    icon: "like",
                    fields: [
                        {
                            name: "ogImage",
                            label: "OG Image",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });

    it("should allow group customization", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"general"} title={"Main Settings"} icon={"page"} />
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "Main Settings",
                    icon: "page",
                    fields: [
                        {
                            name: "title",
                            label: "Title",
                            component: expect.anything()
                        },
                        {
                            name: "snippet",
                            label: "Snippet",
                            component: "textarea"
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });

    it("should allow group removal", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"general"} remove />
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject<{ groups?: Array<unknown> }>(properties);

        expect(data.groups).toBe(undefined);
    });

    it("should allow field customization", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"general"}>
                        {/* Add custom prop via component props. */}
                        <FormField name={"title"} description={"Field #1"} />
                        {/* Add custom prop via children. */}
                        <FormField name={"snippet"}>
                            <Property name={"description"} value={"Field #2"} />
                        </FormField>
                    </SettingsGroup>
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "General Settings",
                    icon: "cog",
                    fields: [
                        {
                            name: "title",
                            label: "Title",
                            component: expect.anything(),
                            description: "Field #1"
                        },
                        {
                            name: "snippet",
                            label: "Snippet",
                            component: expect.anything(),
                            description: "Field #2"
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });

    it("should allow adding fields after a specific field", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"general"}>
                        <FormField
                            name={"email"}
                            label={"Email"}
                            component={"email"}
                            after={"title"}
                        />
                    </SettingsGroup>
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "General Settings",
                    icon: "cog",
                    fields: [
                        {
                            name: "title",
                            label: "Title",
                            component: expect.anything()
                        },
                        {
                            name: "email",
                            label: "Email",
                            component: "email"
                        },
                        {
                            name: "snippet",
                            label: "Snippet",
                            component: expect.anything()
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });

    it("should allow adding fields before a specific field", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"general"}>
                        <FormField
                            name={"email"}
                            label={"Email"}
                            component={"email"}
                            before={"layout"}
                        />
                    </SettingsGroup>
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "General Settings",
                    icon: "cog",
                    fields: [
                        {
                            name: "title",
                            label: "Title",
                            component: expect.anything()
                        },
                        {
                            name: "snippet",
                            label: "Snippet",
                            component: expect.anything()
                        },
                        {
                            name: "email",
                            label: "Email",
                            component: "email"
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });

    it("should allow field removal", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"general"}>
                        <FormField name={"title"} remove />
                    </SettingsGroup>
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "General Settings",
                    icon: "cog",
                    fields: [
                        {
                            name: "snippet",
                            label: "Snippet",
                            component: "textarea"
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });

    it("should allow field replacement", async () => {
        const onChange = jest.fn();

        const view = (
            <CompositionProvider>
                <PageSettingsView onProperties={onChange} />
                <BaseConfig />
                <PageSettingsConfig>
                    <SettingsGroup name={"general"}>
                        <FormField
                            name={"description"}
                            label={"Description"}
                            component={"richtext"}
                            replace={"snippet"}
                        />
                    </SettingsGroup>
                </PageSettingsConfig>
            </CompositionProvider>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toEqual({
            groups: [
                {
                    name: "general",
                    title: "General Settings",
                    icon: "cog",
                    fields: [
                        {
                            name: "title",
                            label: "Title",
                            component: expect.anything()
                        },
                        {
                            name: "description",
                            label: "Description",
                            component: "richtext"
                        },
                        {
                            name: "layout",
                            label: "Layout",
                            component: expect.anything()
                        }
                    ]
                }
            ]
        });
    });
});
