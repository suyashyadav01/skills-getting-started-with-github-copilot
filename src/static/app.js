document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select to avoid duplicate options on re-render
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participants = details.participants || [];
        let participantsHtml = "";
        if (participants.length > 0) {
          participantsHtml = `
            <div class="participants">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${participants.map(p => `<li class="participant-item"><span class="participant-email">${p}</span><button class="participant-remove" data-activity="${name}" data-email="${p}" aria-label="Remove participant">✕</button></li>`).join('')}
              </ul>
            </div>
          `;
        } else {
          participantsHtml = `<div class="participants no-participants">No participants yet</div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHtml}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Wire up remove buttons for participants
        activityCard.querySelectorAll('.participant-remove').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const activityName = btn.dataset.activity;
            const email = btn.dataset.email;
            if (!confirm(`Remove ${email} from ${activityName}?`)) return;
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const data = await resp.json();
              if (resp.ok) {
                messageDiv.textContent = data.message;
                messageDiv.className = 'success';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
                // Re-fetch activities to update UI
                fetchActivities();
              } else {
                messageDiv.textContent = data.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              messageDiv.textContent = 'Failed to remove participant';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              console.error(err);
            }
          });
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
