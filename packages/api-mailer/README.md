# @webiny/api-mailer
[![](https://img.shields.io/npm/dw/@webiny/api-mailer.svg)](https://www.npmjs.com/package/@webiny/api-mailer) 
[![](https://img.shields.io/npm/v/@webiny/api-mailer.svg)](https://www.npmjs.com/package/@webiny/api-mailer)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

  
## Install
```
yarn add @webiny/api-mailer
```


## Built-in Mailers
We have a couple of built-in e-mail mailers:

### Dummy Mailer
A mailer which pretends to be sending e-mails. Used for testing as a backup in case no other mailer is configured or defined.
```typescript
import {createDummyMailer} from "@webiny/api-mailer";

context.mailer.setMailer(async() => {
    return createDummyMailer();
});

```

### SMTP Mailer
A mailer which sends e-mails via the defined SMTP credentials. In the background it uses [nodemailer](https://github.com/nodemailer/nodemailer) library to send the e-mails.

#### Basic Configuration
The configuration is done via the environment variables:
```dotenv
WEBINY_MAILER_HOST=smtp.localhost.test
WEBINY_MAILER_USER=root
WEBINY_MAILER_PASSWORD=password
```
If any of these variables is not defined, mailer will default to the dummy mailer.

#### Advanced Configuration
The advanced configuration is done by creating your own SMTP mailer with custom config. You can still use our `createSmtpMailer` method, you just need to pass the custom configuration.

Here is an example on how to configure custom mailer.
```typescript

import {createSmtpMailer, SmtpMailerConfig} from "@webiny/api-mailer";
import {MailerContext} from "@webiny/api-mailer/types";

/**
 * First we configure the STMP mailer.
 */
const config: SmtpMailerConfig = {
    host: "smtp.localhost.test",
    auth: {
        user: "root",
        pass: "password"
    }
}
const mailer = createSmtpMailer(config);

/**
 * ... then you need to set the mailer to your application
 */

export const handler = createHandler({
    plugins: [
        ...plugins,
        createMailer(),
        // after createMailer() method we can set new mailer
        new ContextPlugin<MailerContext>(async(context) => {
            context.mailer.setMailer(mailer);
        }),
        ...more_plugins
    ],
    http: { debug }
});
```

Note that `setMailer` method supports both setting the variable of `Mailer` type or an async `Mailer` factory.

Example of context plugin which sets mailer via factory:

```typescript
const plugin = new ContextPlugin<MailerContext>(async(context) => {
    context.mailer.setMailer(async() => {
        return import("./pathToSomeMailer").then((createMailer) => {
            return createMailer();
        });
    });
});

```