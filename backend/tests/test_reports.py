def test_end_to_end_rescue_and_vet_lifecycle(client):
    # 1. Register Admin
    admin_reg = client.post("/api/auth/register", json={
        "fullName": "Command Officer",
        "email": "command@pawsos.org",
        "phone": "+91 98000 00000",
        "password": "AdminPassword123!",
        "role": "admin",
        "city": "Mumbai HQ"
    })
    admin_token = admin_reg.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register Rescuer (starts pending)
    rescuer_reg = client.post("/api/auth/register", json={
        "fullName": "Dev Rescuer",
        "email": "dev.rescuer@example.com",
        "phone": "+91 98000 11111",
        "password": "RescuerPassword123!",
        "role": "rescuer",
        "city": "Bandra West",
        "experienceYears": 2,
        "rescueCapabilities": ["Dogs", "Cats"]
    })
    rescuer_id = rescuer_reg.json()["user"]["id"]
    rescuer_token = rescuer_reg.json()["token"]
    rescuer_headers = {"Authorization": f"Bearer {rescuer_token}"}

    # Verify that unverified rescuer is NOT in available rescuers list
    avail_resp = client.get("/api/rescuers/available")
    assert avail_resp.status_code == 200
    rescuers = avail_resp.json()
    assert not any(r["rescuerId"] == rescuer_id for r in rescuers)

    # 3. Admin approves Rescuer
    approve_resp = client.post(f"/api/admin/applications/{rescuer_id}/approve", headers=admin_headers)
    assert approve_resp.status_code == 200

    # Rescuer is now verified and available
    avail_resp_2 = client.get("/api/rescuers/available")
    assert avail_resp_2.status_code == 200
    rescuers_2 = avail_resp_2.json()
    assert any(r["rescuerId"] == rescuer_id for r in rescuers_2)

    # 4. Citizen reports emergency
    report_resp = client.post("/api/reports", json={
        "animalType": "Dog",
        "condition": "Severe Injury, Fractured Leg",
        "description": "Indie dog struck on roadway.",
        "photoUrl": "https://example.com/victim.jpg",
        "lat": 19.0596,
        "lng": 72.8295,
        "address": "Bandra West, Mumbai",
        "urgency": "High",
        "reporterName": "Concerned Citizen",
        "reporterPhone": "+91 99999 88888"
    })
    assert report_resp.status_code == 201
    created_case = report_resp.json()
    case_id = created_case["caseId"]
    report_id = created_case["id"]

    # 5. Admin verifies and assigns to approved Rescuer
    verify_resp = client.post(f"/api/admin/reports/{case_id}/verify", headers=admin_headers)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["verified"] is True

    assign_resp = client.post("/api/assignments", json={
        "rescueReportId": report_id,
        "rescuerId": rescuer_id
    }, headers=admin_headers)
    assert assign_resp.status_code == 200
    assignment_id = assign_resp.json()["assignmentId"]

    # 6. Rescuer accepts assignment
    accept_resp = client.post(f"/api/assignments/{assignment_id}/accept", headers=rescuer_headers)
    assert accept_resp.status_code == 200

    # 7. Rescuer updates status to 'On the Way' then 'Rescued'
    s1_resp = client.patch(f"/api/reports/{case_id}/status", json={
        "status": "On the Way",
        "notes": "Departed base with emergency crate."
    }, headers=rescuer_headers)
    assert s1_resp.status_code == 200
    assert s1_resp.json()["status"] == "On the Way"

    s2_resp = client.patch(f"/api/reports/{case_id}/status", json={
        "status": "Rescued",
        "notes": "Dog secured in vehicle carrier."
    }, headers=rescuer_headers)
    assert s2_resp.status_code == 200
    assert s2_resp.json()["status"] == "Rescued"

    # 8. Register and approve Veterinarian
    vet_reg = client.post("/api/auth/register", json={
        "fullName": "Dr. Rohit Verma",
        "email": "rohit.vet@pawsos.org",
        "phone": "+91 98000 22222",
        "password": "VetPassword123!",
        "role": "vet",
        "city": "Bandra West",
        "clinicName": "Bandra Vet Trauma Hospital",
        "licenseNumber": "VET-MH-2022-8119"
    })
    vet_id = vet_reg.json()["user"]["id"]
    vet_token = vet_reg.json()["token"]
    vet_headers = {"Authorization": f"Bearer {vet_token}"}

    client.post(f"/api/admin/applications/{vet_id}/approve", headers=admin_headers)

    # 9. Veterinarian records clinical chart
    vet_chart_resp = client.post("/api/veterinary/records", json={
        "rescueReportId": report_id,
        "diagnosis": "Left forelimb simple fracture, soft tissue lacerations.",
        "treatment": "Splint immobilization, antiseptic dressing, IV fluids, analgesia.",
        "recoveryStatus": "Stable - In Recovery"
    }, headers=vet_headers)
    assert vet_chart_resp.status_code == 200
    assert vet_chart_resp.json()["status"] == "Treated"

    # 10. Check public tracking
    track_resp = client.get(f"/api/reports/{case_id}")
    assert track_resp.status_code == 200
    tracked = track_resp.json()
    assert tracked["status"] == "Treated"
    assert tracked["veterinaryRecord"]["diagnosis"] == "Left forelimb simple fracture, soft tissue lacerations."
    assert len(tracked["timeline"]) >= 5
