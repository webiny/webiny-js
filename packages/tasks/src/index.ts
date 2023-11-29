import { createPublishPageTask } from "./pages";
import { createTaskInputRegistry } from "./taskInputRegistry";

/**
 * We can create a task to publish a list of pages.
 * If where is sent, we will only publish pages that match the where condition.
 * Otherwise, we will publish all pages.
 */
const publishPageTask = createPublishPageTask({
    where: {}
});

await taskInputRegistry.register([publishPageTask]);



const unzippingTask = createTask(async() => {
    // file
    //unzip
    // 20
    -> 20
        -> create
        -> update
        -> upload files
            -> zip
                -> unzip
            -> nema zipo
        -> publish
    
    createTasks(
        id,
        //
    )
});

onEntryUpdate.subscribe(async() => {
    /// jesam li updateao dynamic pages field
    if (!) {
        return;
    }
    const publishPageTask = createRerenderAndPublishPageTask({
        where: {
            ids: []
        }
    });
    
    await taskInputRegistry.register([publishPageTask]);
});
