import { httpx } from "./helpers/k6.httpx.js";
import { sleep }  from "k6";

// ── Config ──────────────────────────────────────
httpx.baseUrl(httpx.env("BASE_URL", "https://jsonplaceholder.typicode.com"));

// ── Metric declarations (MUST be at init context — top level, outside any function) ──
httpx.declareMetric("posts_duration");

// ── Lifecycle ────────────────────────────────────
httpx.beforeAll(() => {
    console.log("Setting up auth token...");
    // Perform a real login if needed:
    // const res = httpx.post("/auth/login", JSON.stringify({ user: "x", pass: "y" }));
    // httpx.session.setToken(res.json().token);
    httpx.session.setToken("my-demo-token");
});

export function setup() {
    httpx.runHooks("beforeAll");
}

export function teardown() {
    httpx.printTimeline();
    httpx.runHooks("afterAll");
}

// ── Test scenario ────────────────────────────────
export default function () {

    httpx.scenario("User flow", () => {

        // 1. Get list of users
        httpx.step("Fetch users", () => {
            httpx.get("/users")
                .expectStatus(200)
                .expect2xx()
                .expectTime(500)
                .contract({ id: "number", name: "string" })
                .extract({ firstUserId: "[0].id" });
        });

        // 2. Post new resource
        httpx.step("Create post", () => {
            httpx.post(
                "/posts",
                JSON.stringify({ title: "k6 test", body: "hello", userId: 1 }),
                { headers: { "Content-Type": "application/json" } }
            )
            .expectStatus(201)
            .expectJSON({ title: "k6 test" })
            .trace();
        });

        // 3. Parallel GET requests
        httpx.step("Parallel fetch", () => {
            const [r1, r2] = httpx.parallel([
                ["GET", "/posts/1"],
                ["GET", "/posts/2"],
            ]);
            r1.expectStatus(200);
            r2.expectStatus(200);
        });

        // 4. Retry with backoff
        httpx.step("Retry example", () => {
            httpx.retry(
                () => httpx.get("/posts/1").expectStatus(200),
                { retries: 3, baseDelay: 0.5, factor: 2 }
            );
        });

        // 5. Custom metric with tags
        httpx.step("Custom metric", () => {
            const res = httpx.get(httpx.buildUrl("/posts", { userId: 1 }));
            httpx.metric("posts_duration", res.duration(), { endpoint: "posts" });
        });

    });

    sleep(1);
}
