import React, { Fragment } from "react";
import { Cell, Grid, GridInner } from "@webiny/ui/Grid";
import { UILayoutPlugin } from "~/ui/UILayout";
import { UIElement } from "~/ui/UIElement";

interface ElementIDProps {
    children: React.ReactNode;
}

function getElementKey(element: UIElement) {
    return `${element.constructor.name}:${element.id}`;
}

const ElementID = ({ children }: ElementIDProps) => {
    return children as unknown as React.ReactElement;
};

export const uiLayoutPlugin = new UILayoutPlugin(layout => {
    layout.setRenderer(({ layout, props, hasParentGrid }) => {
        if (!layout.getGrid()) {
            return (
                <Fragment>
                    {layout.getLayout().map((row, index) => (
                        <Fragment key={index}>
                            {row.map(item => {
                                const element = layout.getElement(item.element);

                                if (!element) {
                                    console.warn(`Element "${item.element}" was not found!`);
                                    return null;
                                }

                                if (!element.shouldRender(props)) {
                                    return null;
                                }

                                return (
                                    <ElementID key={getElementKey(element)}>
                                        {element.render(props)}
                                    </ElementID>
                                );
                            })}
                        </Fragment>
                    ))}
                </Fragment>
            );
        }

        const GridComponent = hasParentGrid ? GridInner : Grid;

        return (
            <GridComponent>
                {layout.getLayout().map((row, index) => (
                    <Fragment key={index}>
                        {row.map(item => {
                            const element = layout.getElement(item.element);
                            if (!element.shouldRender(props)) {
                                return null;
                            }
                            return (
                                <Cell key={item.element} span={item.width}>
                                    <ElementID key={getElementKey(element)}>
                                        {element.render(props)}
                                    </ElementID>
                                </Cell>
                            );
                        })}
                    </Fragment>
                ))}
            </GridComponent>
        );
    });
});
