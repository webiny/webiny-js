import React from "react";
import get from "lodash/get";
import useUpdateHandlers from "~/editor/plugins/elementSettings/useUpdateHandlers";
import Wrapper from "~/editor/plugins/elementSettings/components/Wrapper";
import Accordion from "~/editor/plugins/elementSettings/components/Accordion";
import {
    ContentWrapper,
    classes
} from "~/editor/plugins/elementSettings/components/StyledComponents";
import InputField from "~/editor/plugins/elementSettings/components/InputField";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";

const DATA_NAMESPACE = "data.settings.tab";

const TabSettings = ({
    defaultAccordionValue
}: PbEditorPageElementSettingsRenderComponentProps) => {
    const [element] = useActiveElement<PbEditorElement>();
    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    return (
        <Accordion title={"Tab"} defaultValue={defaultAccordionValue}>
            <ContentWrapper direction={"column"}>
                <Wrapper
                    label={"Tab label"}
                    leftCellSpan={5}
                    rightCellSpan={7}
                    containerClassName={classes.simpleGrid}
                >
                    <InputField
                        value={get(element, DATA_NAMESPACE + ".label", "")}
                        onChange={getUpdateValue("label")}
                    />
                </Wrapper>
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(TabSettings);
