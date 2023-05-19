import React from "react";
import { Collapsable, Section, Page, Separator, NavGroup } from "./components";

const createPages = (prefix, count = 300) => {
    const elements = [];
    for (let i = 0; i < count; i++) {
        elements.push(<Page key={i} link={`${prefix}/article-${i}`} />);
    }

    return <>{elements}</>;
};

export const Navigation = () => {
    return (
        <NavGroup type={"docs"}>
            <Collapsable title={"Get Started"}>
                <Page link={"get-started/install-webiny"} />
            </Collapsable>
            <Collapsable title={"Webiny Overview"}>
                <Page link={"overview/introduction"} />
                <Page link={"overview/pricing"} />
                <Section title={"Applications"}>{createPages(`overview/applications`)}</Section>
                <Section title={"Features"}>{createPages(`overview/features`)}</Section>
            </Collapsable>
            <Separator />
            <Collapsable title={"Headless CMS"}>
                <Section title={"Basics"}>{createPages(`headless-cms/basics`)}</Section>
                <Section title={"Extending functionality"}>
                    {createPages(`headless-cms/extending`)}
                </Section>
            </Collapsable>
            <Collapsable title={"Page Builder"}>
                <Section title={"Extending functionality"}>
                    {createPages(`page-builder/extending`)}
                </Section>
            </Collapsable>
            <Collapsable title={"Admin Area"}>
                <Section title={"New App Tutorial"}>
                    {createPages(`admin-area/new-app-tutorial`)}
                </Section>
            </Collapsable>
            <Collapsable title={"Architecture"}>
                <Page link={"architecture/introduction"} />
                <Section title={"API Architecture"}>{createPages(`architecture/api`)}</Section>
            </Collapsable>
        </NavGroup>
    );
};
