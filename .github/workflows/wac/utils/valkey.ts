// Valkey for the Vitest runs that need a real Redis server, as a service container on the runner.
//
// Only `@webiny/api-websockets-standalone-redis` needs it: its Redis message bus tests run when
// `WEBINY_TEST_REDIS_URL` is set and are skipped otherwise. That package has no storage operations,
// so the container goes on the "No storage" Vitest job. Every leg of that job gets one.
//
// The health check makes GitHub wait until Valkey answers before running any step, so there is no
// separate wait step as there is for OpenSearch. The cost is that the wait comes before the steps,
// not alongside them: pulling the image and the first healthy check add about 5 seconds to the start
// of every leg.

export const VALKEY_IMAGE = "valkey/valkey:8";

export const VALKEY_SERVICE = {
    valkey: {
        image: VALKEY_IMAGE,
        ports: ["6379:6379"],
        options: [
            '--health-cmd "valkey-cli ping"',
            "--health-interval 2s",
            "--health-timeout 2s",
            "--health-retries 15"
        ].join(" ")
    }
};

export const VALKEY_TEST_URL = "redis://localhost:6379";
