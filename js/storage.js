// Generate unique plan ID
function generatePlanId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `FP-${timestamp}-${random}`.toUpperCase();
}

// Save plan to localStorage
function savePlan() {
  const planData = {
    id: currentPlanId || generatePlanId(),
    timestamp: new Date().toISOString(),
    rooms: rooms,
    doors: doors,
    freehandPaths: freehandPaths,
    roomCounter: roomCounter,
    settings: {
      rollWidth: document.getElementById('rollWidth').value,
      roundTo: document.getElementById('roundTo').value,
      pxPerMeter: document.getElementById('pxPerMeter').value
    }
  };

  currentPlanId = planData.id;
  
  // Save to localStorage
  const savedPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
  savedPlans[planData.id] = planData;
  localStorage.setItem('floorPlans', JSON.stringify(savedPlans));

  // Show plan ID
  const planIdDiv = document.getElementById('currentPlanId');
  planIdDiv.textContent = `Plan ID: ${planData.id}`;
  planIdDiv.style.display = 'block';

  alert(`Plan saved!\nID: ${planData.id}\n\nYou can load this plan anytime using the Load button.`);
}

// Load plan
function loadPlan(planId) {
  const savedPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
  const planData = savedPlans[planId];

  if (!planData) {
    alert('Plan not found!');
    return;
  }

  rooms = planData.rooms;
  doors = planData.doors;
  freehandPaths = planData.freehandPaths;
  roomCounter = planData.roomCounter;
  currentPlanId = planData.id;

  // Restore settings
  if (planData.settings) {
    document.getElementById('rollWidth').value = planData.settings.rollWidth;
    document.getElementById('roundTo').value = planData.settings.roundTo;
    document.getElementById('pxPerMeter').value = planData.settings.pxPerMeter;
  }

  // Show plan ID
  const planIdDiv = document.getElementById('currentPlanId');
  planIdDiv.textContent = `Plan ID: ${planData.id}`;
  planIdDiv.style.display = 'block';

  updateRoomsList();
  draw();
  closeLoadModal();
  alert(`Plan loaded: ${planId}`);
}

// Delete saved plan
function deleteSavedPlan(planId) {
  if (!confirm('Delete this saved plan?')) return;

  const savedPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
  delete savedPlans[planId];
  localStorage.setItem('floorPlans', JSON.stringify(savedPlans));

  if (currentPlanId === planId) {
    currentPlanId = null;
    document.getElementById('currentPlanId').style.display = 'none';
  }

  showLoadModal();
}

// Show load modal
function showLoadModal() {
  const savedPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
  const planIds = Object.keys(savedPlans);

  const list = document.getElementById('savedPlansList');
  list.innerHTML = '';

  if (planIds.length === 0) {
    list.innerHTML = '<p style="color: #999; text-align: center;">No saved plans</p>';
  } else {
    planIds.forEach(planId => {
      const plan = savedPlans[planId];
      const date = new Date(plan.timestamp).toLocaleString();
      const roomCount = plan.rooms.length;

      const div = document.createElement('div');
      div.className = 'saved-plan-item';
      div.innerHTML = `
        <div>
          <strong>${planId}</strong><br>
          <small>${date} • ${roomCount} room(s)</small>
        </div>
        <div>
          <button class="btn-success" onclick="loadPlan('${planId}')">Load</button>
          <button class="btn-danger" onclick="deleteSavedPlan('${planId}')">Delete</button>
        </div>
      `;
      list.appendChild(div);
    });
  }

  document.getElementById('loadModal').style.display = 'flex';
}

function closeLoadModal() {
  document.getElementById('loadModal').style.display = 'none';
}
let selectedRoom = null;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;

canvas.addEventListener('mousedown', (e) => {
  if (currentMode === 'select') {
    const mouseX = e.offsetX;
    const mouseY = e.offsetY;
    selectedRoom = rooms.find(room => isInsideRoom(mouseX, mouseY, room));
    if (selectedRoom) {
      offsetX = mouseX - selectedRoom.x;
      offsetY = mouseY - selectedRoom.y;
      isDragging = true;
    }
  }
});


canvas.addEventListener('mousemove', (e) => {
  if (isDragging && selectedRoom) {
    selectedRoom.x = e.offsetX - offsetX;
    selectedRoom.y = e.offsetY - offsetY;
    draw(); // Redraw canvas with updated positions
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  selectedRoom = null;
});

function isInsideRoom(x, y, room) {
  return x >= room.x && x <= room.x + room.width &&
         y >= room.y && y <= room.y + room.height;
}