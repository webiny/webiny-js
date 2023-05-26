import React, { Dispatch, SetStateAction, useState, useCallback } from "react";
import { i18n } from "@webiny/app/i18n";
import { IconButton } from "@webiny/ui/Button";
import { Cell } from "@webiny/ui/Grid";
import { FormElementMessage } from "@webiny/ui/FormElementMessage";
import { Typography } from "@webiny/ui/Typography";
import {
    BindComponentRenderProp,
    CmsEditorFieldRendererPlugin,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms-common/types";
import DynamicSection from "../DynamicSection";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { ReactComponent as DeleteIcon } from "~/admin/icons/close.svg";
import { ReactComponent as ArrowUp } from "./arrow_drop_up.svg";
import { ReactComponent as ArrowDown } from "./arrow_drop_down.svg";
import Accordion from "~/admin/plugins/fieldRenderers/Accordion";
import {
    fieldsWrapperStyle,
    dynamicSectionTitleStyle,
    dynamicSectionGridStyle,
    fieldsGridStyle,
    ItemHighLight,
    ObjectItem
} from "./StyledComponents";
import { generateAlphaNumericLowerCaseId } from "@webiny/utils";

const t = i18n.ns("app-headless-cms/admin/fields/text");

interface ActionsProps {
    setHighlightIndex: Dispatch<SetStateAction<{ [key: number]: string }>>;
    index: number;
    bind: {
        index: BindComponentRenderProp;
        field: BindComponentRenderProp;
    };
}

const Actions: React.FC<ActionsProps> = ({ setHighlightIndex, bind, index }) => {
    const { moveValueDown, moveValueUp } = bind.field;

    const onDown = useCallback(
        e => {
            e.stopPropagation();
            moveValueDown(index);
            setHighlightIndex(map => ({
                ...map,
                [index + 1]: generateAlphaNumericLowerCaseId(12)
            }));
        },
        [moveValueDown, index]
    );

    const onUp = useCallback(
        e => {
            e.stopPropagation();
            moveValueUp(index);
            setHighlightIndex(map => ({
                ...map,
                [index - 1]: generateAlphaNumericLowerCaseId(12)
            }));
        },
        [moveValueUp, index]
    );

    return index > 0 ? (
        <>
            <IconButton icon={<ArrowDown />} onClick={onDown} />
            <IconButton icon={<ArrowUp />} onClick={onUp} />
            <IconButton icon={<DeleteIcon />} onClick={() => bind.field.removeValue(index)} />
        </>
    ) : null;
};

const ObjectsRenderer: React.FC<CmsModelFieldRendererProps> = props => {
    const [highlightMap, setHighlightIndex] = useState<{ [key: number]: string }>({});
    const { field, contentModel } = props;

    return (
        <DynamicSection
            {...props}
            emptyValue={{}}
            showLabel={false}
            renderTitle={value => (
                <Cell span={12} className={dynamicSectionTitleStyle}>
                    <Typography use={"headline5"}>
                        {`${field.label} ${value.length ? `(${value.length})` : ""}`}
                    </Typography>
                    {field.helpText && <FormElementMessage>{field.helpText}</FormElementMessage>}
                </Cell>
            )}
            gridClassName={dynamicSectionGridStyle}
        >
            {({ Bind, bind, index }) => (
                <ObjectItem>
                    {highlightMap[index] ? <ItemHighLight key={highlightMap[index]} /> : null}
                    <Accordion
                        title={`${props.field.label} #${index + 1}`}
                        action={
                            <Actions
                                setHighlightIndex={setHighlightIndex}
                                index={index}
                                bind={bind}
                            />
                        }
                        // Open first Accordion by default
                        defaultValue={index === 0}
                    >
                        <Cell span={12} className={fieldsWrapperStyle}>
                            <Fields
                                Bind={Bind}
                                {...bind.index}
                                contentModel={contentModel}
                                fields={(field.settings || {}).fields || []}
                                layout={(field.settings || {}).layout || []}
                                gridClassName={fieldsGridStyle}
                            />
                        </Cell>
                    </Accordion>
                </ObjectItem>
            )}
        </DynamicSection>
    );
};

const plugin: CmsEditorFieldRendererPlugin = {
    type: "cms-editor-field-renderer",
    name: "cms-editor-field-renderer-objects",
    renderer: {
        rendererName: "objects",
        name: t`Inline Form`,
        description: t`Renders a set of fields.`,
        canUse({ field }) {
            return field.type === "object" && Boolean(field.multipleValues);
        },
        render(props) {
            return <ObjectsRenderer {...props} />;
        }
    }
};

export default plugin;
