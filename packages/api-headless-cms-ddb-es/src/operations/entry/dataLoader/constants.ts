const batchScheduleWaitEnv = Number(process.env.WEBINY_API_CMS_ENTRY_BATCH_SCHEDULE_WAIT || "0");
export const CMS_ENTRY_BATCH_SCHEDULE_WAIT = isNaN(batchScheduleWaitEnv) ? 0 : batchScheduleWaitEnv;
