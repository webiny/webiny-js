import React, { useCallback } from "react";
import slugify from "slugify";
import { css } from "emotion";
import { useRecoilState } from "recoil";
import pick from "lodash/pick";
import { Form, FormAPI } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { ButtonPrimary } from "@webiny/ui/Button";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { Dialog, DialogCancel, DialogTitle, DialogActions, DialogContent } from "@webiny/ui/Dialog";

import { templateSettingsStateAtom } from "./state";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { PageTemplate } from "~/templateEditor/state";
import { Input } from "@webiny/ui/Input";
import { PbPageLayoutPlugin } from "~/types";
import { Tags } from "@webiny/ui/Tags";

const narrowDialog = css`
    & .mdc-dialog__surface {
        width: 600px;
        min-width: 600px;
    }
`;

const TemplateSettingsModal: React.FC = () => {
    const handler = useEventActionHandler();
    const [template] = useTemplate();
    const [, setState] = useRecoilState(templateSettingsStateAtom);
    const onClose = useCallback(() => {
        setState(false);
    }, []);

    const layouts = React.useMemo(() => {
        const layoutPlugins = plugins.byType<PbPageLayoutPlugin>("pb-page-layout");
        return (layoutPlugins || []).map(pl => pl.layout);
    }, []);

    const updateTemplate = (data: Partial<PageTemplate>) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data
            })
        );
    };

    const generateSlug = (form: FormAPI) => () => {
        if (form.data.slug) {
            return;
        }

        // We want to update slug only when the group is first being created.
        form.setValue(
            "slug",
            slugify(form.data.title, {
                replacement: "-",
                lower: true,
                remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g,
                trim: false
            })
        );
    };

    const onSubmit = useCallback(formData => {
        updateTemplate(formData);
        onClose();
    }, []);

    const settings = pick(template, ["title", "description", "slug", "layout", "tags"]);

    return (
        <Dialog open={true} onClose={onClose} className={narrowDialog}>
            <Form data={settings} onSubmit={onSubmit}>
                {({ form, Bind }) => (
                    <>
                        <DialogTitle>Template Settings</DialogTitle>
                        <DialogContent>
                            <SimpleFormContent>
                                <Grid>
                                    <Cell span={6}>
                                        <Bind
                                            name="title"
                                            validators={[validation.create("required")]}
                                        >
                                            <Input label="Title" onBlur={generateSlug(form)} />
                                        </Bind>
                                    </Cell>
                                    <Cell span={6}>
                                        <Bind
                                            name="slug"
                                            validators={[validation.create("required")]}
                                        >
                                            <Input label="Slug" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="description">
                                            <Input label="Description" />
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind
                                            name="layout"
                                            defaultValue={layouts.length ? layouts[0].name : ""}
                                        >
                                            <Select label="Layout">
                                                {layouts.map(({ name, title }) => (
                                                    <option key={name} value={name}>
                                                        {title}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Bind>
                                    </Cell>
                                    <Cell span={12}>
                                        <Bind name="tags">
                                            <Tags label="Tags" />
                                        </Bind>
                                    </Cell>
                                </Grid>
                            </SimpleFormContent>
                        </DialogContent>
                        <DialogActions>
                            <DialogCancel onClick={onClose}>Cancel</DialogCancel>
                            <ButtonPrimary
                                onClick={ev => {
                                    form.submit(ev);
                                }}
                            >
                                Save
                            </ButtonPrimary>
                        </DialogActions>
                    </>
                )}
            </Form>
        </Dialog>
    );
};

export default TemplateSettingsModal;
