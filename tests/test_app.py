from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src.app import activities, app

client = TestClient(app)


@pytest.fixture(autouse=True)
def restore_activities_state():
    original_activities = deepcopy(activities)
    yield
    activities.clear()
    activities.update(deepcopy(original_activities))


def test_get_activities_returns_all_activities():
    # Arrange
    url = "/activities"

    # Act
    response = client.get(url)

    # Assert
    assert response.status_code == 200
    body = response.json()
    assert "Chess Club" in body
    assert "Programming Class" in body
    assert isinstance(body, dict)


def test_signup_for_activity_adds_new_participant():
    # Arrange
    activity_name = "Chess Club"
    email = "newstudent@mergington.edu"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.post(url, params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {email} for {activity_name}"}
    assert email in activities[activity_name]["participants"]


def test_signup_for_activity_returns_400_when_already_signed_up():
    # Arrange
    activity_name = "Programming Class"
    email = "emma@mergington.edu"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.post(url, params={"email": email})

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"


def test_signup_for_nonexistent_activity_returns_404():
    # Arrange
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.post(url, params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_without_email_returns_422():
    # Arrange
    activity_name = "Chess Club"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.post(url)

    # Assert
    assert response.status_code == 422
    assert response.json()["detail"]


def test_unregister_removes_existing_participant():
    # Arrange
    activity_name = "Gym Class"
    email = "john@mergington.edu"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.delete(url, params={"email": email})

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Removed {email} from {activity_name}"}
    assert email not in activities[activity_name]["participants"]


def test_unregister_nonparticipant_returns_404():
    # Arrange
    activity_name = "Soccer Practice"
    email = "notregistered@mergington.edu"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.delete(url, params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in activity"


def test_unregister_nonexistent_activity_returns_404():
    # Arrange
    activity_name = "Dance Club"
    email = "student@mergington.edu"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.delete(url, params={"email": email})

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_without_email_returns_422():
    # Arrange
    activity_name = "Art Studio"
    url = f"/activities/{activity_name}/signup"

    # Act
    response = client.delete(url)

    # Assert
    assert response.status_code == 422
    assert response.json()["detail"]
