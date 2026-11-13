import random
from locust import HttpUser, task, between, events

class SeatSearchCandidateUser(HttpUser):
    """
    Simulates admission candidates searching for their seat plan.
    Hits GET /api/seat/search/?admission_roll=<roll>
    """
    wait_time = between(0.1, 0.5)

    @task(10)
    def search_valid_roll(self):
        # Sample of rolls seeded in database
        roll = random.choice([
            "100001", "100002", "100003", "100004", "100005",
            "100010", "100020", "100030", "100040", "100050",
            "200001", "200002", "300001", "400001", "500123"
        ])
        with self.client.get(
            f"/api/seat/search/?admission_roll={roll}",
            catch_response=True,
            name="/api/seat/search/ [Valid Roll]"
        ) as response:
            if response.status_code in (200, 404, 429):
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @task(2)
    def search_random_roll(self):
        # Random roll between 100000 and 150000
        roll = str(random.randint(100000, 150000))
        with self.client.get(
            f"/api/seat/search/?admission_roll={roll}",
            catch_response=True,
            name="/api/seat/search/ [Random Roll]"
        ) as response:
            if response.status_code in (200, 404, 429):
                response.success()
            else:
                response.failure(f"Unexpected status: {response.status_code}")

    @task(1)
    def view_public_help(self):
        self.client.get("/api/help/", name="/api/help/")

    @task(1)
    def view_public_steps(self):
        self.client.get("/api/steps/", name="/api/steps/")

