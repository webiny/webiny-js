import React from "react";
import get from "lodash/get";
import { usePage } from "@webiny/app-page-builder/render/hooks/usePage";
import { PbElement } from "~/types";
import Text from "~/render/components/Text";

export const className = "webiny-pb-base-page-element-style webiny-pb-page-element-text";

type TextPropsType = {
    element: PbElement;
};

const Paragraph: React.FunctionComponent<TextPropsType> = ({ element }) => {
    const page = usePage();
    const elementDataSource = get(element, `data.dataSource`);
    let text = "";
    
    if (elementDataSource.path.includes(".")) {
        try {
            const pageDataSource = page.dataSources.find(ds => ds.id === elementDataSource.id);
            text = get(pageDataSource.data, elementDataSource.path);
        } catch {}
    }

    return <Text element={element} text={text} />;
};

export default Paragraph;
