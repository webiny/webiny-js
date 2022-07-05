/**
 * @jest-environment jsdom
 */
import React, { useCallback } from "react";
import { render } from "@testing-library/react";
import { Properties, Property, useParentProperty, toObject } from "~/index";
import { getLastCall } from "./utils";

interface GroupProps {
    name: string;
    label?: string;
}

const Group: React.FC<GroupProps> = ({ name, label, children }) => {
    return (
        <Property id={`group:${name}`} name={"settingsGroup"} array={true}>
            <Property id={`group:${name}:name`} name={"name"} value={name} />
            {label ? <Property id={`group:${name}:label`} name={"label"} value={label} /> : null}
            {children}
        </Property>
    );
};

interface FieldProps {
    name: string;
    label?: string;
    remove?: boolean;
    replace?: string;
}

const Field: React.FC<FieldProps> = ({ name, label, replace, remove = false }) => {
    const parentProperty = useParentProperty();

    const id = parentProperty ? parentProperty.id : undefined;

    const getId = useCallback(
        (suffix = undefined) => [id, "field", name, suffix].filter(Boolean).join(":"),
        []
    );
    const toReplace = replace !== undefined ? `${id}:field:${replace}` : undefined;

    return (
        <Property id={getId()} name={"field"} array remove={remove} replace={toReplace}>
            <Property id={getId("name")} name={"name"} value={name} />
            {label ? <Property id={getId("label")} name={"label"} value={label} /> : null}
        </Property>
    );
};

describe("Test Properties", () => {
    it("should create 2 properties", async () => {
        const onChange = jest.fn();
        const view = (
            <Properties onChange={onChange}>
                <Property id={"label"} name={"label"} value={"Label"} />
                <Property name={"name"} value={"basic"} />
            </Properties>
        );

        render(view);

        expect(onChange).toHaveBeenLastCalledWith([
            { id: "label", name: "label", value: "Label", parent: "", array: false },
            { id: expect.any(String), name: "name", value: "basic", parent: "", array: false }
        ]);
    });

    it("should create nested properties", async () => {
        const onChange = jest.fn();
        const view = (
            <Properties onChange={onChange}>
                <Property id="1" name={"group"}>
                    <Property name={"name"} value={"layout"} />
                    <Property name={"label"} value={"Layout"} />
                    <Property id="2" name={"toolbar"}>
                        <Property name={"name"} value={"basic"} />
                    </Property>
                </Property>
            </Properties>
        );

        render(view);

        expect(onChange).toHaveBeenLastCalledWith([
            { id: expect.any(String), name: "name", value: "layout", parent: "1", array: false },
            { id: expect.any(String), name: "label", value: "Layout", parent: "1", array: false },
            { id: expect.any(String), name: "name", value: "basic", parent: "2", array: false },
            {
                id: expect.any(String),
                name: "toolbar",
                value: undefined,
                parent: "1",
                array: false
            },
            { id: "1", name: "group", value: undefined, parent: "", array: false }
        ]);
    });

    it("should convert to a single object", async () => {
        const onChange = jest.fn();
        const view = (
            <Properties onChange={onChange}>
                <Property name={"group"}>
                    <Property name={"name"} value={"layout"} />
                    <Property name={"label"} value={"Layout"} />
                    <Property name={"toolbar"}>
                        <Property name={"name"} value={"basic"} />
                    </Property>
                </Property>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            group: {
                name: "layout",
                label: "Layout",
                toolbar: {
                    name: "basic"
                }
            }
        });
    });

    it("should treat a single object as an array (array prop)", async () => {
        const onChange = jest.fn();
        const view = (
            <Properties onChange={onChange}>
                <Property name={"group"} array>
                    <Property name={"name"} value={"layout"} />
                    <Property name={"label"} value={"Layout"} />
                    <Property name={"toolbar"}>
                        <Property name={"name"} value={"basic"} />
                    </Property>
                </Property>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            group: [
                {
                    name: "layout",
                    label: "Layout",
                    toolbar: {
                        name: "basic"
                    }
                }
            ]
        });
    });

    it("should convert to an array of objects", async () => {
        const onChange = jest.fn();
        const view = (
            <Properties onChange={onChange}>
                <Property name={"group"}>
                    <Property name={"name"} value={"layout"} />
                    <Property name={"label"} value={"Layout"} />
                    <Property name={"toolbar"}>
                        <Property name={"name"} value={"basic"} />
                    </Property>
                </Property>
                <Property name={"group"}>
                    <Property name={"name"} value={"heroes"} />
                    <Property name={"label"} value={"Heroes"} />
                    <Property name={"toolbar"}>
                        <Property name={"name"} value={"heroes"} />
                    </Property>
                </Property>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            group: [
                {
                    name: "layout",
                    label: "Layout",
                    toolbar: {
                        name: "basic"
                    }
                },
                {
                    name: "heroes",
                    label: "Heroes",
                    toolbar: {
                        name: "heroes"
                    }
                }
            ]
        });
    });

    it("should convert to an array of objects using custom components", async () => {
        interface GroupProps {
            name: string;
            label?: string;
        }

        const Group: React.FC<GroupProps> = ({ name, label, children }) => {
            return (
                <Property name={"group"}>
                    <Property name={"name"} value={name} />
                    {label ? <Property name={"label"} value={label} /> : null}
                    {children}
                </Property>
            );
        };

        interface ToolbarProps {
            name: string;
        }

        const Toolbar: React.FC<ToolbarProps> = ({ name }) => {
            return (
                <Property name={"toolbar"}>
                    <Property name={"name"} value={name} />
                </Property>
            );
        };

        const onChange = jest.fn();

        const view = (
            <Properties onChange={onChange}>
                <Group name={"layout"} label={"Layout"}>
                    <Toolbar name={"basic"} />
                </Group>
                <Group name={"heroes"} label={"Heroes"}>
                    <Toolbar name={"heroes"} />
                </Group>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            group: [
                {
                    name: "layout",
                    label: "Layout",
                    toolbar: {
                        name: "basic"
                    }
                },
                {
                    name: "heroes",
                    label: "Heroes",
                    toolbar: {
                        name: "heroes"
                    }
                }
            ]
        });
    });

    it("should merge properties for matching 'name' prop", async () => {
        const onChange = jest.fn();

        const view = (
            <Properties onChange={onChange}>
                <Group name={"styleSettings"} label={"Style Settings"}>
                    <Field name={"color"} label={"Color"} />
                    <Field name={"component"} label={"Component"} />
                </Group>
                <Group name={"elementSettings"} label={"Element Settings"}>
                    <Field name={"url"} label={"URL"} />
                    <Field name={"newTab"} label={"Open in new tab"} />
                </Group>
                <Group name={"styleSettings"} label={"Style"}>
                    <Field name={"component"} label={"Render"} />
                    <Field name={"url"} label={"Open URL"} />
                </Group>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            settingsGroup: [
                {
                    name: "styleSettings",
                    label: "Style",
                    field: [
                        {
                            name: "color",
                            label: "Color"
                        },
                        {
                            name: "component",
                            label: "Render"
                        },
                        { name: "url", label: "Open URL" }
                    ]
                },
                {
                    name: "elementSettings",
                    label: "Element Settings",
                    field: [
                        { name: "url", label: "URL" },
                        { name: "newTab", label: "Open in new tab" }
                    ]
                }
            ]
        });
    });

    it("should allow addition of custom properties to predefined components", async () => {
        const onChange = jest.fn();

        const Tutorial: React.FC<{ label: string }> = ({ label }) => {
            return <Property name={"tutorial"} value={label} />;
        };

        const view = (
            <Properties onChange={onChange}>
                <Group name={"styleSettings"} label={"Style Settings"}>
                    <Field name={"color"} label={"Color"} />
                    <Field name={"component"} label={"Component"} />
                </Group>
                <Group name={"styleSettings"}>
                    <Tutorial label={"Learn more"} />
                </Group>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            settingsGroup: [
                {
                    name: "styleSettings",
                    label: "Style Settings",
                    field: [
                        {
                            name: "color",
                            label: "Color"
                        },
                        {
                            name: "component",
                            label: "Component"
                        }
                    ],
                    tutorial: "Learn more"
                }
            ]
        });
    });

    it("should remove existing property by 'name' and add a new one", async () => {
        const onChange = jest.fn();

        const view = (
            <Properties onChange={onChange}>
                {/* Define base properties */}
                <Group name={"styleSettings"} label={"Style Settings"}>
                    <Field name={"color"} label={"Color"} />
                    <Field name={"component"} label={"Component"} />
                </Group>
                {/* Remove existing fields and add a new one */}
                <Group name={"styleSettings"}>
                    <Field name={"component"} remove />
                    <Field name={"color"} remove />
                    <Field name={"link"} label={"Link"} />
                </Group>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(toObject(properties)).toEqual({
            settingsGroup: [
                {
                    name: "styleSettings",
                    label: "Style Settings",
                    field: [{ name: "link", label: "Link" }]
                }
            ]
        });
    });

    it("should replace existing property with a new one", async () => {
        const onChange = jest.fn();

        const view = (
            <Properties onChange={onChange}>
                {/* Define base properties */}
                <Group name={"styleSettings"} label={"Style Settings"}>
                    <Field name={"color"} label={"Color"} />
                    <Field name={"component"} label={"Component"} />
                </Group>
                {/* Remove existing fields and add a new one */}
                <Group name={"styleSettings"}>
                    <Field name={"link"} label={"Link"} replace={"color"} />
                </Group>
            </Properties>
        );

        render(view);

        const properties = getLastCall(onChange);

        expect(properties.length).toBe(9);
        expect(toObject(properties)).toEqual({
            settingsGroup: [
                {
                    name: "styleSettings",
                    label: "Style Settings",
                    field: [
                        { name: "link", label: "Link" },
                        { name: "component", label: "Component" }
                    ]
                }
            ]
        });
    });
});
