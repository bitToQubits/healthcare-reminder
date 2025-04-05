import request from 'supertest';
import app from '../main.mjs';
import { describe, it, expect } from 'vitest';

describe("GET /api/v1/calls", () => {
    it("Should return all calls", async () => {
        return request(app)
            .get("/api/v1/calls")
            .expect('Content-Type', /json/)
            .expect(200)
            .then((res) => {
                expect(res.statusCode).toBe(200);
            })
    });
});

describe("POST /api/v1/calls/outbound", () => {
    it("Should NOT create a call", async () => {
        return request(app)
            .post("/api/v1/calls/outbound")
            .expect('Content-Type', /json/)
            .expect(400)
            .then((res) => {
                expect(res.statusCode).toBe(400);
            })
    });
});

describe("POST /api/v1/calls/inbound", () => {
    it("Should receive valid TwiML for inbound calls", async () => {
        return request(app)
            .post("/api/v1/calls/inbound")
            .expect('Content-Type', /xml/)
            .expect(200)
            .then((res) => {
                expect(res.statusCode).toBe(200);
            })
    });
});