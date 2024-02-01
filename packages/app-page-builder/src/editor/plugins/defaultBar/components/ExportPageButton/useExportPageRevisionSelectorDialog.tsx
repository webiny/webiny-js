import React from "react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import { useDialog } from "@webiny/app-admin/hooks/useDialog";
import { Typography } from "@webiny/ui/Typography";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { Form } from "@webiny/form";
import { Alert } from "@webiny/ui/Alert";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { PbElementDataSettingsFormType } from "~/types";
import { PbRevisionType } from "~/contexts/PageBuilder";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/exportPageButton");

const confirmationMessageStyles = css`
    width: 600px;
`;

const gridStyles = css`
    &.mdc-layout-grid {
        padding-top: 0;
    }
`;
interface ExportPageDialogMessageProps {
    selected: string[];
}

const ExportPageDialogMessage = ({ selected }: ExportPageDialogMessageProps) => {
    const { exportPageData } = usePageBuilder();
    const { revisionType: value, setRevisionType: setValue } = exportPageData;

    return (
        <div className={confirmationMessageStyles}>
            <Grid className={gridStyles}>
                <Cell span={12}>
                    <Typography
                        use={"subtitle1"}
                    >{t`Choose which revision of the page(s) you want to export:`}</Typography>
                </Cell>
                <Cell span={12}>
                    <Form
                        data={{ revision: value }}
                        onChange={data => {
                            const { revision } = data as unknown as PbElementDataSettingsFormType;
                            /**
                             * We expect revision to be string.
                             */
                            return setValue(revision as PbRevisionType);
                        }}
                    >
                        {({ Bind }) => (
                            <Bind name="revision">
                                <RadioGroup
                                    label="Revision selection"
                                    description={
                                        "Note: If there is no published revision of a page the latest revision will be exported."
                                    }
                                >
                                    {({ onChange, getValue }) => (
                                        <React.Fragment>
                                            {[
                                                { id: "published", name: "Published" },
                                                {
                                                    id: "latest",
                                                    name: "Latest"
                                                }
                                            ].map(({ id, name }) => (
                                                <Radio
                                                    key={id}
                                                    label={name}
                                                    value={getValue(id)}
                                                    onChange={onChange(id)}
                                                />
                                            ))}
                                        </React.Fragment>
                                    )}
                                </RadioGroup>
                            </Bind>
                        )}
                    </Form>
                </Cell>
            </Grid>
            {selected.length === 0 && (
                <Grid className={gridStyles}>
                    <Cell span={12}>
                        <Alert title={t`Note:`} type={"info"}>
                            {t`You're about to export all pages. This operation might take a few minutes to complete.`}
                        </Alert>
                    </Cell>
                </Grid>
            )}
        </div>
    );
};

interface UseExportPageRevisionSelectorDialogShowParams {
    onAccept: () => void;
    selected: string[];
}
interface UseExportPageRevisionSelectorDialog {
    showExportPageRevisionSelectorDialog: (
        params: UseExportPageRevisionSelectorDialogShowParams
    ) => void;
    hideDialog: () => void;
}
const useExportPageRevisionSelectorDialog = (): UseExportPageRevisionSelectorDialog => {
    const { showDialog, hideDialog } = useDialog();

    return {
        showExportPageRevisionSelectorDialog: ({ onAccept, selected }) => {
            showDialog(<ExportPageDialogMessage selected={selected} />, {
                title: t`Select Page Revision`,
                actions: {
                    cancel: { label: t`Cancel` },
                    accept: {
                        label: t`Continue`,
                        onClick: () => {
                            // Give it sometime
                            setTimeout(onAccept, 500);
                        }
                    }
                },
                dataTestId: "export-pages.select-revision-type-dialog"
            });
        },
        hideDialog
    };
};

export default useExportPageRevisionSelectorDialog;
