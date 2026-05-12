import { Route, Websockets } from "webiny/api";

interface FileEnrichmentBody {
    file: { id: string; name: string };
    tags: string[];
    description: string;
}

class NotifyFileEnrichmentRoute implements Route.Interface {
    constructor(private websockets: Websockets.Interface) {}

    async execute(request: Route.Request, reply: Route.Reply) {
        const { file, tags, description } = request.body as FileEnrichmentBody;

        const connectionsResult = await this.websockets.listConnections();
        if (connectionsResult.isOk() && connectionsResult.value.length > 0) {
            await this.websockets.sendToConnections(connectionsResult.value, {
                action: "fm.file.enrichment",
                data: { id: file.id, name: file.name, tags, description }
            });
        }

        reply.send({ notified: connectionsResult.value?.length ?? 0 });
    }
}

export default Route.createImplementation({
    implementation: NotifyFileEnrichmentRoute,
    dependencies: [Websockets]
});
