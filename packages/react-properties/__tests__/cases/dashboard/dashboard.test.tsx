/**
 * @jest-environment jsdom
 */
import React from "react";
import { render } from "@testing-library/react";
import { Property, toObject } from "~/index";
import { App, DashboardConfig, useDashboardConfig } from "./App";
import { getLastCall } from "~tests/utils";

const { AddWidget } = DashboardConfig;

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

    interface Link {
        url: string;
        title: string;
    }

    it("should contain new custom properties", async () => {
        function CustomDashboard() {
            const { link = [] } = useDashboardConfig<{ link: Link[] }>();

            return (
                <ul>
                    {link.map(item => (
                        <li key={item.title}>
                            {item.title}: {item.url}
                        </li>
                    ))}
                </ul>
            );
        }

        /**
         * This custom component will allow us to expose a user-friendly API to developers, hook into the existing
         * data structure of the Dashboard, and add our new properties (links in this case).
         */
        interface LinkProps {
            url: string;
            title: string;
        }

        const Link = ({ url, title }: LinkProps) => {
            return (
                <Property id={title} name={"link"} array>
                    <Property name={"url"} value={url} />
                    <Property name={"title"} value={title} />
                </Property>
            );
        };

        const onChange = jest.fn();

        const view = (
            <App onProperties={onChange}>
                <DashboardConfig>
                    {/* Register new properties. */}
                    <Link title={"Webiny"} url={"www.webiny.com"} />
                    <Link title={"Google"} url={"www.google.com"} />
                </DashboardConfig>
                <CustomDashboard />
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
