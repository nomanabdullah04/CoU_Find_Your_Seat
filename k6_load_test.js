import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 500 },    // Ramp up to 500 VUs
    { duration: '30s', target: 5000 },   // Spike to 5,000 concurrent users
    { duration: '30s', target: 5000 },   // Stay at 5,000 concurrent users
    { duration: '15s', target: 0 },      // Ramp down
  ],
  thresholds: {
    // 95% of requests must complete within 200ms
    http_req_duration: ['p(95)<200'],
    // Less than 1% failed requests (excluding expected 404s/429s)
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://127.0.0.1:8000';

const KNOWN_ROLLS = [
  '100001', '100002', '100003', '100004', '100005',
  '100010', '100020', '100030', '100040', '100050',
  '200001', '200002', '300001', '400001', '500123'
];

export default function () {
  // 80% search known seeded rolls, 20% search random rolls
  let roll;
  if (Math.random() < 0.8) {
    roll = KNOWN_ROLLS[Math.floor(Math.random() * KNOWN_ROLLS.length)];
  } else {
    roll = Math.floor(100000 + Math.random() * 50000).toString();
  }

  const res = http.get(`${BASE_URL}/api/seat/search/?admission_roll=${roll}`);

  check(res, {
    'status is 200 or 404 or 429': (r) => [200, 404, 429].includes(r.status),
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  // Candidate think time: 100ms - 300ms
  sleep(Math.random() * 0.2 + 0.1);
}

