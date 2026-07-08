import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:30080";
const params = { timeout: "20s" };

export const options = {
  vus: 5,
  duration: "60s",
  thresholds: {
    http_req_duration: ["p(95) < 10000"],
    checks: ["rate > 0.95"],
  },
};

export function setup() {
  const res = http.post(
    `${BASE}/auth/login`,
    JSON.stringify({ email: "usuario@allright.app", password: "AllRight2026!Secure" }),
    { headers: { "Content-Type": "application/json" }, ...params }
  );
  const token = res.json("access_token");
  return { token };
}

export default function (data) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.token}`,
  };

  const proveRes = http.post(
    `${BASE}/location/prove`,
    JSON.stringify({ lat: 3.4516, lon: -76.5320 }),
    { headers, ...params }
  );
  check(proveRes, { "prove status 2xx": (r) => r.status === 200 || r.status === 201 });

  if (proveRes.status === 200 || proveRes.status === 201) {
    const proveBody = proveRes.json();
    const verifyRes = http.post(
      `${BASE}/location/verify`,
      JSON.stringify({ proof: proveBody.proof, payload: proveBody.payload }),
      { headers, ...params }
    );
    check(verifyRes, { "verify status 2xx": (r) => r.status === 200 || r.status === 201 });
  }

  sleep(1);
}
