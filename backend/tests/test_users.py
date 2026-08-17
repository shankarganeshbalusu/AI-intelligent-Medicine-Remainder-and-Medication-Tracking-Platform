def test_get_and_update_profile(client):
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "password": "strongpassword123",
            "role": "patient"
        }
    )
    
    # Login to get token
    login_res = client.post(
        "/api/auth/login",
        json={
            "email": "jane@example.com",
            "password": "strongpassword123"
        }
    ).json()
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get Profile
    get_res = client.get("/api/users/me", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Jane Doe"
    
    # Update Profile
    update_res = client.put(
        "/api/users/me",
        json={"name": "Jane Updated"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Jane Updated"
    
    # Verify update persisted
    get_res2 = client.get("/api/users/me", headers=headers)
    assert get_res2.json()["name"] == "Jane Updated"


def test_caregiver_link_flow(client):
    # Register patient
    client.post(
        "/api/auth/register",
        json={
            "name": "Patient Pete",
            "email": "pete@example.com",
            "password": "petepassword",
            "role": "patient"
        }
    )
    
    # Register caregiver
    client.post(
        "/api/auth/register",
        json={
            "name": "Caregiver Carl",
            "email": "carl@example.com",
            "password": "carlpassword",
            "role": "caregiver"
        }
    )
    
    # Login patient
    patient_login = client.post(
        "/api/auth/login",
        json={"email": "pete@example.com", "password": "petepassword"}
    ).json()
    patient_headers = {"Authorization": f"Bearer {patient_login['access_token']}"}
    
    # Login caregiver
    caregiver_login = client.post(
        "/api/auth/login",
        json={"email": "carl@example.com", "password": "carlpassword"}
    ).json()
    caregiver_headers = {"Authorization": f"Bearer {caregiver_login['access_token']}"}
    
    # Patient links caregiver
    link_res = client.post(
        "/api/users/link-caregiver",
        json={"caregiver_email": "carl@example.com"},
        headers=patient_headers
    )
    assert link_res.status_code == 200
    link_data = link_res.json()
    assert link_data["status"] == "pending"
    assert link_data["patient_name"] == "Patient Pete"
    assert link_data["caregiver_name"] == "Caregiver Carl"
    link_id = link_data["id"]
    
    # Caregiver views associations
    assoc_res = client.get("/api/users/associations", headers=caregiver_headers)
    assert assoc_res.status_code == 200
    assocs = assoc_res.json()
    assert len(assocs) == 1
    assert assocs[0]["id"] == link_id
    assert assocs[0]["status"] == "pending"
    
    # Caregiver accepts link request
    respond_res = client.put(
        f"/api/users/associations/{link_id}?status_update=active",
        headers=caregiver_headers
    )
    assert respond_res.status_code == 200
    assert respond_res.json()["status"] == "active"
    
    # Patient views associations to see updated active status
    pat_assoc_res = client.get("/api/users/associations", headers=patient_headers)
    assert pat_assoc_res.json()[0]["status"] == "active"


def test_change_password_success(client):
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "name": "Jane Password",
            "email": "jane_pass@example.com",
            "password": "oldpassword123",
            "role": "patient"
        }
    )
    
    # Login to get token
    login_res = client.post(
        "/api/auth/login",
        json={"email": "jane_pass@example.com", "password": "oldpassword123"}
    ).json()
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Change password
    change_res = client.put(
        "/api/users/me/password",
        json={"current_password": "oldpassword123", "new_password": "newpassword123"},
        headers=headers
    )
    assert change_res.status_code == 200
    assert change_res.json()["status"] == "password updated successfully"
    
    # Try logging in with old password (should fail)
    login_fail = client.post(
        "/api/auth/login",
        json={"email": "jane_pass@example.com", "password": "oldpassword123"}
    )
    assert login_fail.status_code == 403
    
    # Try logging in with new password (should succeed)
    login_success = client.post(
        "/api/auth/login",
        json={"email": "jane_pass@example.com", "password": "newpassword123"}
    )
    assert login_success.status_code == 200


def test_change_password_fail(client):
    # Register user
    client.post(
        "/api/auth/register",
        json={
            "name": "Jane Fail",
            "email": "jane_fail@example.com",
            "password": "correctpassword",
            "role": "patient"
        }
    )
    
    # Login to get token
    login_res = client.post(
        "/api/auth/login",
        json={"email": "jane_fail@example.com", "password": "correctpassword"}
    ).json()
    token = login_res["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Change password with WRONG current password
    change_res = client.put(
        "/api/users/me/password",
        json={"current_password": "wrongcurrentpassword", "new_password": "newpassword123"},
        headers=headers
    )
    assert change_res.status_code == 400
    assert "incorrect" in change_res.json()["detail"]

