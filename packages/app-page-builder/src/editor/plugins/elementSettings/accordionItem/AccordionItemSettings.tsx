import React from "react";
import { css } from "emotion";
import get from "lodash/get";
import { Switch } from "@webiny/ui/Switch";
import useUpdateHandlers from "~/editor/plugins/elementSettings/useUpdateHandlers";
import Wrapper from "~/editor/plugins/elementSettings/components/Wrapper";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import { ContentWrapper } from "~/editor/plugins/elementSettings/components/StyledComponents";
import InputField from "~/editor/plugins/elementSettings/components/InputField";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";

const classes = {
    grid: css`
        &.mdc-layout-grid {
            padding: 0;
            margin: 0px 0px 16px;
        }
    `,
    rightCellStyle: css`
        justify-self: end;
        align-self: center;
    `,
    leftCellStyle: css`
        align-self: center;
    `
};

const DATA_NAMESPACE = "data.settings.accordionItem";

const AccordionItemSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const [element] = useActiveElement<PbEditorElement>();
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    return (
        <Accordion title={"Accordion Item"} defaultValue={defaultAccordionValue}>
            <ContentWrapper direction={"column"}>
                <Wrapper label={"Title"} containerClassName={classes.grid}>
                    <InputField
                        value={get(element, DATA_NAMESPACE + ".title", 0)}
                        onChange={getUpdateValue("title")}
                    />
                </Wrapper>
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Expand by default"}
                    leftCellSpan={8}
                    rightCellSpan={4}
                    leftCellClassName={classes.leftCellStyle}
                    rightCellClassName={classes.rightCellStyle}
                >
                    <Switch
                        value={get(element, DATA_NAMESPACE + ".expanded", false)}
                        onChange={getUpdateValue("expanded")}
                    />
                </Wrapper>
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(AccordionItemSettings);
