// ─── Auto-save (debounced, runs on every draw) ───────────────────────────────
let _autoSaveTimer = null;
function autoSave() {
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    if (rooms.length === 0) return;
    try {
      const data = {
        timestamp: new Date().toISOString(),
        rooms, doors, freehandPaths, roomCounter,
        settings: {
          rollWidth:   document.getElementById('rollWidth').value,
          roundTo:     document.getElementById('roundTo').value,
          pxPerMeter:  document.getElementById('pxPerMeter').value,
          wastePerCut: document.getElementById('wastePerCut').value
        }
      };
      localStorage.setItem('carpet-autosave', JSON.stringify(data));
    } catch(e) {}
  }, 1500);
}

// Offer to restore last unsaved session on startup
function checkAutoSave() {
  const raw = localStorage.getItem('carpet-autosave');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    if (!data.rooms || data.rooms.length === 0) return;
    const date = new Date(data.timestamp).toLocaleString('en-GB');
    const names = data.rooms.map(r => r.name).join(', ');
    if (confirm(`Restore unsaved session?\n\nLast activity: ${date}\nRooms: ${names}`)) {
      rooms           = data.rooms;
      doors           = data.doors           || [];
      freehandPaths   = data.freehandPaths   || [];
      roomCounter     = data.roomCounter     || 1;
      if (data.settings) {
        document.getElementById('rollWidth').value   = data.settings.rollWidth;
        document.getElementById('roundTo').value     = data.settings.roundTo;
        document.getElementById('pxPerMeter').value  = data.settings.pxPerMeter;
        if (data.settings.wastePerCut !== undefined)
          document.getElementById('wastePerCut').value = data.settings.wastePerCut;
      }
      updateRoomsList();
      draw();
    }
  } catch(e) {}
}

// ─── Restore the known floor plan from screenshot ────────────────────────────
function restoreMyFloorPlan() {
  if (rooms.length > 0) {
    if (!confirm('This will replace your current rooms with the saved floor plan.\n\nHallway 1, Hallway 2, Lounge, Room 1\n\nContinue?')) return;
  }

  const ppm = getPxPerMeter();
  const pad = 20;

  const h1W = +(2.47 * ppm).toFixed(2), h1H = +(2.15 * ppm).toFixed(2);
  const h2W = +(2.77 * ppm).toFixed(2), h2H = +(1.10 * ppm).toFixed(2);
  const loW = +(5.19 * ppm).toFixed(2), loH = +(5.13 * ppm).toFixed(2);
  const r1W = +(4.74 * ppm).toFixed(2), r1H = +(5.39 * ppm).toFixed(2);

  const row1Y = pad;
  const row2Y = pad + Math.max(h1H, h2H) + pad;

  rooms = [
    { id: Date.now() + 1, name: 'Hallway 1',
      x: pad,            y: row1Y, width: h1W, height: h1H,
      orientation: 'length', color: '#27ae60', doors: [] },
    { id: Date.now() + 2, name: 'Hallway 2',
      x: pad + h1W + pad, y: row1Y, width: h2W, height: h2H,
      orientation: 'length', color: '#27ae60', doors: [] },
    { id: Date.now() + 3, name: 'Lounge',
      x: pad,             y: row2Y, width: loW, height: loH,
      orientation: 'length', color: '#9b59b6', doors: [] },
    { id: Date.now() + 4, name: 'Room 1',
      x: pad + loW + pad, y: row2Y, width: r1W, height: r1H,
      orientation: 'length', color: '#2ecc71', doors: [] },
  ];
  doors         = [];
  freehandPaths = [];
  roomCounter   = 5;
  selectedRoom  = null;
  currentPlanId = null;

  const planIdDiv = document.getElementById('currentPlanId');
  planIdDiv.textContent = 'Restored: My Floor Plan — save to keep it';
  planIdDiv.style.display = 'block';

  updateRoomsList();
  draw();
}

// ─── Generate unique plan ID ──────────────────────────────────────────────────
function generatePlanId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `FP-${timestamp}-${random}`.toUpperCase();
}

// Save plan to localStorage
function savePlan() {
  const defaultName = (document.getElementById('jobRef').value || '').trim()
    || rooms.map(r => r.name).join(', ')
    || 'My Plan';
  const label = prompt('Name this plan (shown in the load list):', defaultName);
  if (label === null) return; // cancelled

  const planData = {
    id:        currentPlanId || generatePlanId(),
    label:     label.trim() || defaultName,
    timestamp: new Date().toISOString(),
    rooms, doors, freehandPaths, roomCounter,
    settings: {
      rollWidth:   document.getElementById('rollWidth').value,
      roundTo:     document.getElementById('roundTo').value,
      pxPerMeter:  document.getElementById('pxPerMeter').value,
      wastePerCut: document.getElementById('wastePerCut').value
    }
  };

  currentPlanId = planData.id;

  const savedPlans = JSON.parse(localStorage.getItem('floorPlans') || '{}');
  savedPlans[planData.id] = planData;
  localStorage.setItem('floorPlans', JSON.stringify(savedPlans));

  const planIdDiv = document.getElementById('currentPlanId');
  planIdDiv.textContent = `Saved: ${planData.label}`;
  planIdDiv.style.display = 'block';

  alert(`Plan saved as "${planData.label}".\n\nLoad it anytime with the Load Plan button.`);
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
    document.getElementById('rollWidth').value  = planData.settings.rollWidth;
    document.getElementById('roundTo').value    = planData.settings.roundTo;
    document.getElementById('pxPerMeter').value = planData.settings.pxPerMeter;
    if (planData.settings.wastePerCut !== undefined)
      document.getElementById('wastePerCut').value = planData.settings.wastePerCut;
  }

  const planIdDiv = document.getElementById('currentPlanId');
  planIdDiv.textContent = `Loaded: ${planData.label || planData.id}`;
  planIdDiv.style.display = 'block';

  updateRoomsList();
  draw();
  closeLoadModal();
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
  const planIds = Object.keys(savedPlans).sort(
    (a, b) => new Date(savedPlans[b].timestamp) - new Date(savedPlans[a].timestamp)
  );

  const card   = 'display:flex;justify-content:space-between;align-items:center;gap:12px;' +
                 'padding:12px 14px;margin-bottom:8px;border-radius:8px;';
  const btnBase = 'border:none;border-radius:6px;padding:7px 14px;font-size:0.78rem;' +
                  'font-weight:600;cursor:pointer;color:#fff;white-space:nowrap;';

  // ── Built-in recovery entry ─────────────────────────────────────────────────
  let html = `
    <div style="${card}background:#fff7ed;border:1.5px solid #f59e0b;">
      <div style="min-width:0">
        <div style="font-weight:700;color:#92400e;font-size:0.9rem;">↩ My Floor Plan</div>
        <div style="font-size:0.75rem;color:#b45309;margin-top:2px;">
          Hallway&nbsp;1 &bull; Hallway&nbsp;2 &bull; Lounge &bull; Room&nbsp;1
        </div>
      </div>
      <button style="${btnBase}background:#d97706;"
              onclick="restoreMyFloorPlan();closeLoadModal()">Restore</button>
    </div>`;

  // ── Divider ─────────────────────────────────────────────────────────────────
  if (planIds.length > 0) {
    html += `<div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;
                         letter-spacing:.05em;margin:14px 0 8px;">Saved plans</div>`;
  }

  // ── Saved plans ─────────────────────────────────────────────────────────────
  planIds.forEach(id => {
    const p     = savedPlans[id];
    const title = p.label || id;
    const date  = new Date(p.timestamp).toLocaleString('en-GB');
    const names = (p.rooms || []).map(r => r.name).join(', ') || '—';
    html += `
      <div style="${card}background:#f8fafc;border:1px solid #e2e8f0;">
        <div style="min-width:0;overflow:hidden">
          <div style="font-weight:700;color:#1e293b;font-size:0.88rem;
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
          <div style="font-size:0.72rem;color:#64748b;margin-top:2px;">${date}</div>
          <div style="font-size:0.72rem;color:#64748b;
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${names}</div>
        </div>
        <div style="display:flex;gap:6px;flex-shrink:0">
          <button style="${btnBase}background:#2563eb;"
                  onclick="loadPlan('${id}')">Load</button>
          <button style="${btnBase}background:#dc2626;"
                  onclick="deleteSavedPlan('${id}')">Delete</button>
        </div>
      </div>`;
  });

  if (planIds.length === 0) {
    html += `<p style="text-align:center;color:#94a3b8;font-size:0.82rem;margin-top:14px;">
               No saved plans yet — use <strong>Save Plan</strong> to save one.
             </p>`;
  }

  // ── Close button ────────────────────────────────────────────────────────────
  html += `<div style="margin-top:18px;text-align:right;border-top:1px solid #e5e7eb;padding-top:14px;">
             <button onclick="closeLoadModal()"
                     style="${btnBase}background:#64748b;">Close</button>
           </div>`;

  document.getElementById('savedPlansList').innerHTML = html;
  const modal = document.getElementById('loadModal');
  modal.style.display = 'flex';
}

function closeLoadModal() {
  document.getElementById('loadModal').style.display = 'none';
}