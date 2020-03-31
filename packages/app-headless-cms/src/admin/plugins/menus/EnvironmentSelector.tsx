import React from "react";
import { i18n } from "@webiny/app/i18n";
import { useCms } from "@webiny/app-headless-cms/admin/hooks";

import { Select } from "@webiny/ui/Select";
import { css } from "emotion";
import { Form } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/menus/environment-selector");
const style = {
    wrapper: css({
        maxWidth: 200,
        margin: "0 auto"
    })
};

const EnvironmentSelector = function() {
    const {
        environments: { currentEnvironment, environments, selectEnvironment }
    } = useCms();

    return (
        <div className={style.wrapper} data-testid="cms-environments-selector">
            <Form
                data={{ environment: currentEnvironment.id }}
                onChange={data =>
                    selectEnvironment(environments.find(item => item.id === data.environment))
                }
            >
                {({ Bind }) => (
                    <Bind name={"environment"}>
                        <Select
                            label={t`Environment`}
                            options={environments.map(item => {
                                return { value: item.id, label: item.name };
                            })}
                        />
                    </Bind>
                )}
            </Form>
        </div>
    );
};

export default EnvironmentSelector;
