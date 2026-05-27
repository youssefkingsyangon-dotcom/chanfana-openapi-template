import { ApiException, fromHono } from "chanfana";
import { Hono } from "hono";
import { tasksRouter } from "./endpoints/tasks/router";
import { ContentfulStatusCode } from "hono/utils/http-status";
import { DummyEndpoint } from "./endpoints/dummyEndpoint";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// ✅ AI ROUTE (Cloudflare AI version)
app.post("/ai", async (c) => {
  const body = await c.req.json();

  const result = await c.env.AI.run(
    "@cf/meta/llama-3-8b-instruct",
    {
      messages: [
        {
          role: "system",
          content: "You are a typing coach AI. Give short helpful advice."
        },
        {
          role: "user",
          content: body.message
        }
      ]
    }
  );

  return c.json({
    reply: result.response
  });
});

// Error handler
app.onError((err, c) => {
  if (err instanceof ApiException) {
    return c.json(
      { success: false, errors: err.buildResponse() },
      err.status as ContentfulStatusCode,
    );
  }

  console.error("Global error handler caught:", err);

  return c.json(
    {
      success: false,
      errors: [{ code: 7000, message: "Internal Server Error" }],
    },
    500,
  );
});

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
  schema: {
    info: {
      title: "My Awesome API",
      version: "2.0.0",
      description: "This is the documentation for my awesome API.",
    },
  },
});

// Register Tasks Sub router
openapi.route("/tasks", tasksRouter);

// Register other endpoints
openapi.post("/dummy/:slug", DummyEndpoint);

// Export the app
export default app;
