import React, { useEffect, useMemo } from "react";
import { Helmet } from "react-helmet";

const parseHeaderTags = (str?: string) => {
    if (!str) {
        return [];
    }

    const dom = new DOMParser().parseFromString(str, "text/html");
    const elements = dom.documentElement.querySelectorAll(":not(html):not(head):not(body)");
    const parsedElementsArray: JSX.Element[] = [];

    elements.forEach((el, index) => {
        const nodeName = el.nodeName.toLowerCase();
        const attributes = Object.fromEntries(
            [...el.attributes].map(({ name, value }) => [name, value])
        );
        const newElement = React.createElement(
            nodeName,
            { ...attributes, key: index },
            el.innerHTML
        );

        parsedElementsArray.push(newElement);
    });

    return parsedElementsArray;
};

const parseFooterTags = (str?: string) => {
    if (!str) {
        return [];
    }

    const dom = new DOMParser().parseFromString(str, "text/html");
    const elements = dom.documentElement.querySelectorAll("script");
    const parsedElementsArray: Element[] = [];

    elements.forEach(el => {
        const newElement = document.createElement("script");
        [...el.attributes].forEach(({ name, value }) => newElement.setAttribute(name, value));
        newElement.innerHTML = el.innerHTML;

        parsedElementsArray.push(newElement);
    });

    return parsedElementsArray;
};

const appendToBody = (elements: Element[]) => {
    for (const element of elements) {
        document.body.append(element);
    }
};

const removeFromBody = (elements: Element[]) => {
    for (const element of elements) {
        element.remove();
    }
};

type WebsiteScriptsProps = {
    headerTags?: string;
    footerTags?: string;
};

const WebsiteScripts = ({ headerTags, footerTags }: WebsiteScriptsProps) => {
    // `WebsiteScripts` component doesn't do anything if we're
    // in the middle of a prerendering process.
    if ("__PS_RENDER__" in window) {
        return null;
    }

    const htmlHeadTags = useMemo(() => {
        return parseHeaderTags(headerTags);
    }, [headerTags]);

    useEffect(() => {
        const htmlFooterTags = parseFooterTags(footerTags);

        appendToBody(htmlFooterTags);

        return () => {
            removeFromBody(htmlFooterTags);
        };
    }, [footerTags]);

    return <Helmet>{htmlHeadTags?.map(element => element)}</Helmet>;
};

export default WebsiteScripts;
