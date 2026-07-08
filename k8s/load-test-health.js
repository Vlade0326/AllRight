import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:30080";

export const options = {
  vus: 20,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95) < 300"],
    checks: ["rate > 0.99"],
  },
};

export default function () {
  const res = http.get(`${BASE}/health`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(0.5);
}
