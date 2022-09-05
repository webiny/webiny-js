/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { Compose, HigherOrderComponent } from "@webiny/react-composition";
import { Property, toObject, useProperties } from "~/index";
import { App, DashboardConfig } from "./App";
import { getLastCall } from "~tests/utils";

const { AddWidget, DashboardRenderer } = DashboardConfig;

describe("Dashboard", () => {
    it("should contain 2 widgets (the built-in one, and the custom one)", async () => {
        const onChange = jest.fn();
        /**
         * <App/> contains the built-in widget, and we're using the <DashboardConfig/> component to register more widgets.
         */
        const view = (
            <App onProperties={onChange}>
                <DashboardConfig>
                    <AddWidget<{ title: string; button: unknown }>
                        name={"new-widget"}
                        title={"Latest News"}
                        type={"card"}
                        button={<div />}
                    />
                </DashboardConfig>
            </App>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toMatchObject({
            widget: [
                {
                    name: "my-widget",
                    title: "My Widget",
                    type: "card",
                    button: expect.anything()
                },
                {
                    name: "new-widget",
                    title: "Latest News",
                    type: "card",
                    button: <div />
                }
            ]
        });
    });

    it("should contain the built-in widget with modified values", async () => {
        const onChange = jest.fn();
        const view = (
            <App onProperties={onChange}>
                <DashboardConfig>
                    <AddWidget<{ title: string; button: unknown }>
                        name={"my-widget"}
                        title={"My own title!"}
                        type={"card"}
                        button={null}
                    />
                </DashboardConfig>
            </App>
        );

        render(view);

        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toMatchObject({
            widget: [
                {
                    name: "my-widget",
                    title: "My own title!",
                    type: "card",
                    button: null
                }
            ]
        });
    });

    it("should contain new custom properties", async () => {
        /**
         * Let's create a custom Dashboard renderer to render links (which are our custom property).
         */
        const CustomDashboard: HigherOrderComponent = () => {
            return function CustomDashboard() {
                const { getObject } = useProperties();
                const { link } = getObject<{ link: { title: string; url: string }[] }>();

                return (
                    <ul>
                        {link.map(item => (
                            <li key={item.title}>
                                {item.title}: {item.url}
                            </li>
                        ))}
                    </ul>
                );
            };
        };

        /**
         * This custom component will allow us to expose a user-friendly API to developers, hook into the existing
         * data structure of the Dashboard, and add our new properties (links in this case).
         */
        interface LinkProps {
            url: string;
            title: string;
        }

        const Link: React.FC<LinkProps> = ({ url, title }) => {
            return (
                <Property name={"link"} array>
                    <Property name={"url"} value={url} />
                    <Property name={"title"} value={title} />
                </Property>
            );
        };

        const onChange = jest.fn();
        const view = (
            <App onProperties={onChange}>
                <DashboardConfig>
                    {/* Compose the renderer, to intercept the rendering process and render custom Links. */}
                    <Compose component={DashboardRenderer} with={CustomDashboard} />
                    {/* Register new properties. */}
                    <Link title={"Webiny"} url={"www.webiny.com"} />
                    <Link title={"Google"} url={"www.google.com"} />
                </DashboardConfig>
            </App>
        );

        const { container } = render(view);

        // Verify the new data structure
        const properties = getLastCall(onChange);
        const data = toObject(properties);

        expect(data).toMatchObject({
            widget: [
                {
                    name: "my-widget",
                    title: "My Widget",
                    type: "card",
                    button: expect.anything()
                }
            ],
            link: [
                { title: "Webiny", url: "www.webiny.com" },
                { title: "Google", url: "www.google.com" }
            ]
        });

        // Verify that our custom renderer is rendering the expected output.
        expect(container.innerHTML).toEqual(
            "<ul><li>Webiny: www.webiny.com</li><li>Google: www.google.com</li></ul>"
        );
    });
});
