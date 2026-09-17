import { TaskDefinition, TaskHandler } from "webiny/api/tasks";
import { MailerService } from "webiny/api/mailer";

class SendEmailTaskHandlerImpl implements TaskHandler.Interface {
    public constructor(private readonly mailerService: MailerService.Interface) {}

    public async run(params: TaskHandler.RunParams): Promise<TaskHandler.Result> {
        const { controller, input } = params;

        const result = await this.mailerService.sendMail({
            subject: "Hello from SendEmailTask!",
            to: ["bruno@webiny.com"],
            text: JSON.stringify(input),
            html: `<pre>${JSON.stringify(input)}</pre>`,
            from: "bruno.zoric@gmail.com",
            replyTo: "bruno@webiny.com"
        });

        if (result.isFail()) {
            return controller.response.error(`Failed to send email: ${result.error.message}`);
        } else if (result.value.error) {
            return controller.response.error(`Failed to send email: ${result.value.error.message}`);
        }

        return controller.response.done(JSON.stringify(result.value.result));
    }
}

const SendEmailTaskHandler = TaskHandler.createImplementation({
    implementation: SendEmailTaskHandlerImpl,
    dependencies: [MailerService]
});

class SendEmailTaskImpl implements TaskDefinition.Interface {
    public readonly id = "sendEmailTask";
    public readonly title = "Send Email";
    public readonly description = "A task which will send an email with stringified input params.";
    public readonly isPrivate = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    public readonly handler = SendEmailTaskHandler;
}

export default TaskDefinition.createImplementation({
    implementation: SendEmailTaskImpl,
    dependencies: []
});
