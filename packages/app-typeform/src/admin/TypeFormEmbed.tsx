import React from "react";
import { useRecoilValue } from "recoil";
import { elementByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import useRenderEmptyEmbed from "@webiny/app-page-builder/editor/plugins/elements/utils/oembed/useRenderEmptyEmbed";

type TypeFormEmbedPropsType = {
    elementId: string;
};
const TypeFormEmbed: React.VFC<TypeFormEmbedPropsType> = ({ elementId }) => {
    const element = useRecoilValue(elementByIdSelector(elementId));
    const renderEmpty = useRenderEmptyEmbed(element);

    if (!element) {
        return null;
    }
    const { source } = element.data;
    if (!source || !source.url) {
        return renderEmpty();
    }

    return <iframe frameBorder="0" src={source.url} style={{ height: "100%", width: "100%" }} />;
};

export default React.memo(TypeFormEmbed);
