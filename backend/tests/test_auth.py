def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_citizen_registration(client):
    payload = {
        "fullName": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "phone": "+91 98765 43210",
        "password": "Password123!",
        "role": "citizen",
        "city": "South Mumbai"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "token" in data
    assert data["user"]["email"] == "priya.sharma@example.com"
    assert data["user"]["role"] == "citizen"
    assert data["user"]["verificationStatus"] == "verified"  # Citizens auto-verified

def test_rescuer_registration_requires_verification(client):
    payload = {
        "fullName": "Rahul Patel",
        "email": "rahul.rescuer@example.com",
        "phone": "+91 98765 11111",
        "password": "Password123!",
        "role": "rescuer",
        "city": "Bandra West",
        "experienceYears": 3,
        "rescueCapabilities": ["Dogs", "First Aid"]
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "rescuer"
    assert data["user"]["verificationStatus"] == "pending"  # Must await admin approval
    assert data["user"]["experienceYears"] == 3

def test_veterinary_registration_requires_verification(client):
    payload = {
        "fullName": "Dr. Sameer Khan",
        "email": "sameer.vet@example.com",
        "phone": "+91 98765 22222",
        "password": "Password123!",
        "role": "vet",
        "city": "Andheri West",
        "clinicName": "Andheri Animal Emergency Care",
        "clinicAddress": "Veera Desai Road, Andheri West",
        "licenseNumber": "VET-MH-2021-4991",
        "emergency247": True
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["role"] == "vet"
    assert data["user"]["verificationStatus"] == "pending"
    assert data["user"]["clinicName"] == "Andheri Animal Emergency Care"
    assert data["user"]["emergency247"] is True

def test_login_success(client):
    client.post("/api/auth/register", json={
        "fullName": "Anand Rao",
        "email": "anand.rao@example.com",
        "phone": "+91 98111 22222",
        "password": "SecurePassword99!",
        "role": "citizen",
        "city": "Pune"
    })

    login_resp = client.post("/api/auth/login", json={
        "email": "anand.rao@example.com",
        "password": "SecurePassword99!"
    })
    assert login_resp.status_code == 200
    login_data = login_resp.json()
    assert "token" in login_data
    assert login_data["user"]["email"] == "anand.rao@example.com"

def test_login_invalid_password(client):
    client.post("/api/auth/register", json={
        "fullName": "Test User",
        "email": "test@example.com",
        "phone": "+91 99999 99999",
        "password": "CorrectPassword1!",
        "role": "citizen",
        "city": "Mumbai"
    })

    login_resp = client.post("/api/auth/login", json={
        "email": "test@example.com",
        "password": "WrongPassword!"
    })
    assert login_resp.status_code == 401
