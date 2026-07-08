import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:30080";

export const options = {
  scenarios: {
    ramp_500: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 200 },
        { duration: "2m", target: 500 },
        { duration: "2m", target: 500 },
        { duration: "1m", target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.10"],
    http_req_duration: ["p(95)<1500"],
    checks: ["rate>0.90"],
  },
};

export default function () {
  const res = http.get(`${BASE}/health`);
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
  sleep(0.5);
}
