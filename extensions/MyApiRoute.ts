import { Route, TaskService } from "webiny/api";
import { MY_REPORT_TASK_ID } from "./MyReportTask.js";

interface RequestBody {
    userId: string;
}

class MyApiRouteImpl implements Route.Interface {
    constructor(private taskService: TaskService.Interface) {}

    async execute(request: Route.Request, reply: Route.Reply) {
        const { userId } = request.body as RequestBody;

        const result = await this.taskService.trigger({
            definitionId: MY_REPORT_TASK_ID,
            name: "Generate Report",
            input: { userId }
        });

        if (result.isFail()) {
            return reply.code(500).send({ error: result.error.message });
        }

        return reply.code(202).send({ taskId: result.value.id });
    }
}

export default Route.createImplementation({
    implementation: MyApiRouteImpl,
    dependencies: [TaskService]
});
