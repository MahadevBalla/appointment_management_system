import random
from locust import HttpUser, task, between

class AppointmentSystemSustainedLoad(HttpUser):
    # Simulate a user thinking/navigating for 1 to 3 seconds between actions
    wait_time = between(1, 3)
    
    # Store dynamic IDs loaded during user initialization
    service_id = 1
    slot_ids = []
    
    def on_start(self):
        """ Runs when a simulated user starts up. Logs in to obtain JWT. """
        # Register/Login user to get headers
        self.auth_headers = {}
        email = f"customer_{random.randint(0, 999)}@stress.test"
        
        # Log in dynamically to fetch SimpleJWT
        response = self.client.post("/api/auth/login/", json={
            "email": email,
            "password": "password123"  # Ensure seeded users share a password, or mock auth
        })
        
        if response.status_code == 200:
            token = response.json().get("access")
            self.auth_headers = {"Authorization": f"Bearer {token}"}

    @task(10)
    def check_availability(self):
        """ Read-Heavy Task: Simulates users checking calendar availability """
        # Pick a random date in the next 30 days
        days_offset = random.randint(0, 30)
        target_date = (random.randint(2026, 2026), random.randint(6, 8), random.randint(1, 28))
        date_str = f"2026-07-{random.randint(10, 28)}"
        
        self.client.get(
            f"/api/availability/{self.service_id}/{date_str}/",
            name="/api/availability/[service_id]/[date]/"
        )

    @task(2)
    def view_services(self):
        """ Read Task: Users browsing published services """
        self.client.get("/api/services/")

    @task(1)
    def create_booking_attempt(self):
        """ Write-Heavy Transactional Task: Simulates users reserving a slot """
        if not self.auth_headers:
            return  # Skip if auth failed
            
        # Target a random slot ID (assuming IDs 1 through 1000 exist from the seed)
        random_slot_id = random.randint(1, 1000)
        
        self.client.post(
            "/api/bookings/",
            headers=self.auth_headers,
            json={
                "slot": random_slot_id,
                "answers": {"question_1": "Load Test Value"},
                "quantity": 1
            },
            name="/api/bookings/ (Create)"
        )
