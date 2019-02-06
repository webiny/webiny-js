# webiny-integration-mailchimp

Render Mailchimp newsletter signup form.

## Installation
`yarn add webiny-integration-mailchimp`

## Setup
To setup, you must register a set of plugins. For more information on plugins, please visit Webiny documentation.

#### API
```
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/api"
import { registerPlugins } from "webiny-plugins";

registerPlugins(...mailchimpPlugins);
```

Exposes necessary GraphQL fields that handle integration settings and newsletter signup form submits. 

#### Admin

##### 1. Register plugins

```
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/admin"
import { registerPlugins } from "webiny-plugins";

registerPlugins(...mailchimpPlugins);
```

Enables management of Mailchimp settings, which can be accessed via Settings section in the main menu. You will paste
your Mailchimp API key here (this is required in order for the integration to work properly). 

Additionally, this will also register Mailchimp element in CMS editor, which will enable you to insert
newsletter signup forms in your pages. The element will be registered under the "Form" element category.

##### 2. Register newsletter signup form component
To complete the admin setup, register one or more newsletter signup forms. Registration is done via CMS theme.
For example in `demo-theme/src/index.js`: 

```
import * as React from "react";
import { MailchimpDefaultForm } from "webiny-integration-mailchimp/render/components";

export default {
    fonts: {
        ...
    },
    colors: {
        ...
    },
    elements: {
        pagesList: {
            ...
        },
        mailchimp: {
            components: [
                {
                    name: "default",
                    title: "Default page list",
                    component: MailchimpDefaultForm
                },
                {
                    name: "custom",
                    title: "Custom page list",
                    component: (props: *) => {
                        const { Bind, submit } = props;
                        return (
                            <div>
                                <Bind name={"email"} validate={["required"]}>
                                    <Input label={"Your e-mail"} />
                                </Bind>
                                <ButtonPrimary onClick={submit}>Submit</ButtonPrimary>
                            </div>
                        );
                    }
                }
            ]
        }        
    },
    styles: {
        ...
    }
};
```

Use `Bind` component to bind form elements and `submit` callback to submit the form.
 
#### Site
```
import mailchimpPlugins from "webiny-integration-mailchimp/plugins/render"
import { registerPlugins } from "webiny-plugins";

registerPlugins(mailchimpPlugins);
```

Enables Mailchimp newsletter signup form render in your public website.

