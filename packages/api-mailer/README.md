# @webiny/api-mailer
[![](https://img.shields.io/npm/dw/@webiny/api-mailer.svg)](https://www.npmjs.com/package/@webiny/api-mailer) 
[![](https://img.shields.io/npm/v/@webiny/api-mailer.svg)](https://www.npmjs.com/package/@webiny/api-mailer)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

  
## Install
```
yarn add @webiny/api-mailer
```


## Built-in Senders
We have a couple of built-in e-mail senders:

### Dummy Sender
A sender which pretends to be sending e-mails. Used for testing as a backup in case no other sender is configured or defined.
```typescript
import {createDummySender} from "@webiny/api-mailer";

context.mailer.setSender(async() => {
    return createDummySender();
});

```

### SMTP Sender
A sender which sends e-mails via the defined SMTP credentials. In the background it uses [nodemailer](https://github.com/nodemailer/nodemailer) library to send the e-mails.

#### Basic Configuration
The configuration is done via the environment variables:
```dotenv
WEBINY_MAILER_HOST=smtp.localhost.test
WEBINY_MAILER_USER=root
WEBINY_MAILER_PASSWORD=password
```
If any of these variables is not defined, sender will default to the dummy sender.

#### Advanced Configuration
The advanced configuration is done by creating your own SMTP sender with custom config. You can still use our `createSmtpSender` method, you just need to pass the custom configuration.

Here is an example on how to configure custom sender.
```typescript

import {createSmtpSender, SmtpSenderConfig} from "@webiny/api-mailer";
import {MailerContext} from "@webiny/api-mailer/types";

/**
 * First we configure the STMP sender.
 */
const config: SmtpSenderConfig = {
    host: "smtp.localhost.test",
    auth: {
        user: "root",
        pass: "password"
    }
}
const sender = createSmtpSender(config);

/**
 * ... then you need to set the sender to your application
 */

export const handler = createHandler({
    plugins: [
        ...plugins,
        createMailer(),
        // after createMailer() method we can set new sender
        new ContextPlugin<MailerContext>(async(context) => {
            context.mailer.setSender(sender);
        }),
        ...more_plugins
    ],
    http: { debug }
});
```

Note that setSender method supports both setting the variable of MailerSender type or an async function which returns MailerSender variable type.

Example of context plugin which sets sender via async function:

```typescript
const plugin = new ContextPlugin<MailerContext>(async(context) => {
    context.mailer.setSender(async() => {
        return import("./pathToSomeSender").then((createSender) => {
            return createSender();
        });
    });
});

```