import React from "react";
import { elementByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { i18n } from "@webiny/app/i18n";
import { useRecoilValue } from "recoil";
const t = i18n.ns("app-typeform/admin");

type TypeFormEmbedPropsType = {
    elementId: string;
};
const TypeFormEmbed: React.FunctionComponent<TypeFormEmbedPropsType> = ({ elementId }) => {
    const element = useRecoilValue(elementByIdSelector(elementId));
    if (!element) {
        return null;
    }
    const { source } = element.data;
    if (!source || !source.url) {
        return <span>{t`You must configure your embed in the settings!`}</span>;
    }

    return <iframe frameBorder="0" src={source.url} style={{ height: "100%", width: "100%" }} />;
};

export default React.memo(TypeFormEmbed);
