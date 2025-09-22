import request from "supertest";
import type { Express } from "express";
import { createApp } from "./app";

describe("App", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createApp();
  });

  describe("Health Endpoints", () => {
    it("should respond to /health", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.text).toBe("ok");
    });

    it("should respond to /healthz", async () => {
      const response = await request(app).get("/healthz").expect(200);

      expect(response.text).toBe("ok");
    });

    it("should respond to /livez", async () => {
      const response = await request(app).get("/livez").expect(200);

      expect(response.text).toBe("alive");
    });

    it("should respond to /readyz", async () => {
      const response = await request(app).get("/readyz").expect(200);

      expect(response.text).toBe("ready");
    });
  });

  describe("GraphQL Endpoint", () => {
    it("should respond to GraphQL introspection query", async () => {
      const introspectionQuery = {
        query: `
          query IntrospectionQuery {
            __schema {
              types {
                name
              }
            }
          }
        `,
      };

      const response = await request(app)
        .post("/graphql")
        .send(introspectionQuery)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.__schema).toBeDefined();
    });
  });
});
