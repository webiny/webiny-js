import React, { useEffect } from "react";
import { Helmet } from "react-helmet";

const parseHeaderTags = (str?: string) => {
    if (!str) {
        return null;
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
        return null;
    }

    const dom = new DOMParser().parseFromString(str, "text/html");
    return dom.documentElement.querySelectorAll("script");
};

const appendToBody = (elements: NodeListOf<Element> | null) => {
    elements?.forEach(element => {
        document.body.appendChild(element);
    });
};

const removeFromBody = (elements: NodeListOf<Element> | null) => {
    elements?.forEach(element => {
        document.body.removeChild(element);
    });
};

type WebsiteScriptsProps = {
    headerTags?: string;
    footerTags?: string;
};

const WebsiteScripts: React.FC<WebsiteScriptsProps> = ({ headerTags, footerTags }) => {
    const htmlHeadTags = parseHeaderTags(headerTags);

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
