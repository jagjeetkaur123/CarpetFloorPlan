// Carpet calculation helpers

function roundUp(val, step) {
  if (!step || step <= 0) return val;
  return Math.ceil(val / step) * step;
}

function fmt(n)    { return n.toFixed(2); }
function fmtGBP(n) { return '\u00a3' + n.toFixed(2); }

// ─── Core room calculator ─────────────────────────────────────────────────────
// Accepts: room = { name, length (m), width (m), orientation ('auto'|'length'|'width') }
// offcuts array is mutated in place; pass a fresh [] each calculate() session.

function calcRoom(room, rollWidth, roundTo, offcuts) {
  const L = room.length, W = room.width;
  if (!L || !W) return null;

  let runSide, acrossSide, orientLabel;

  const dropsAlongLength = Math.ceil(W / rollWidth); // run along L, across W
  const dropsAlongWidth  = Math.ceil(L / rollWidth); // run along W, across L

  if (!room.orientation || room.orientation === 'auto') {
    const lenA = dropsAlongLength * L;
    const lenB = dropsAlongWidth  * W;
    if (dropsAlongLength < dropsAlongWidth ||
        (dropsAlongLength === dropsAlongWidth && lenA <= lenB)) {
      runSide = L; acrossSide = W; orientLabel = 'along length';
    } else {
      runSide = W; acrossSide = L; orientLabel = 'along width';
    }
  } else if (room.orientation === 'length') {
    runSide = L; acrossSide = W; orientLabel = 'along length';
  } else {
    runSide = W; acrossSide = L; orientLabel = 'along width';
  }

  // --- Offcut reuse ---
  for (let i = 0; i < offcuts.length; i++) {
    const strip = offcuts[i];

    // Offcut covers the entire room
    if (strip.width >= acrossSide && strip.length >= runSide) {
      const surplusW = strip.width - acrossSide;
      offcuts.splice(i, 1);
      if (surplusW > 0.05) offcuts.push({ from: strip.from, width: surplusW, length: strip.length });
      const surplus = surplusW > 0.05 ? `, ${fmt(surplusW)}m surplus re-stored` : '';
      return {
        roomLen: 0, joints: 0, drops: 1,
        carpetArea: acrossSide * runSide,
        offcutUsed: `Entire room from offcut [${strip.from}]${surplus}`,
        offcutGenerated: null,
        orientLabel
      };
    }

    // Offcut covers the partial last drop
    const fullDrops   = Math.floor(acrossSide / rollWidth);
    const leftoverGap = acrossSide - fullDrops * rollWidth;
    if (leftoverGap > 0.001 && strip.width >= leftoverGap && strip.length >= runSide) {
      const surplusW = strip.width - leftoverGap;
      offcuts.splice(i, 1);
      if (surplusW > 0.05) offcuts.push({ from: strip.from, width: surplusW, length: strip.length });
      const roomLen    = roundUp(fullDrops * runSide, roundTo);
      const carpetArea = fullDrops * rollWidth * runSide + leftoverGap * runSide;
      const surplus    = surplusW > 0.05 ? `, ${fmt(surplusW)}m surplus re-stored` : '';
      return {
        roomLen, joints: fullDrops, drops: fullDrops + 1,
        carpetArea,
        offcutUsed: `Last drop (${fmt(leftoverGap)}m) from offcut [${strip.from}]${surplus}`,
        offcutGenerated: null,
        orientLabel
      };
    }
  }

  const totalDrops = Math.ceil(acrossSide / rollWidth);
  const joints     = totalDrops - 1;
  const leftoverW  = totalDrops * rollWidth - acrossSide;
  const roomLen    = roundUp(totalDrops * runSide, roundTo);
  const carpetArea = roomLen * rollWidth;

  let offcutGenerated = null;
  if (leftoverW > 0.05) {
    offcutGenerated = { from: room.name, width: leftoverW, length: runSide };
    offcuts.push(offcutGenerated);
  }

  return { roomLen, joints, drops: totalDrops, carpetArea, offcutUsed: null, offcutGenerated, orientLabel };
}

// ─── Main calculate() ─────────────────────────────────────────────────────────

function calculate() {
  if (rooms.length === 0) {
    alert('Please draw some rooms first!');
    return;
  }

  const ppm          = getPxPerMeter();
  const rollWidth    = parseFloat(document.getElementById('rollWidth').value)    || 4;
  const roundTo      = parseFloat(document.getElementById('roundTo').value)      || 0.1;
  const pricePerSqm  = parseFloat(document.getElementById('pricePerSqm').value)  || 0;
  const fittingCost  = parseFloat(document.getElementById('fittingCost').value)  || 0;
  const pricePerLinM = pricePerSqm * rollWidth;

  const offcuts     = []; // fresh each calculation
  let totalLen      = 0;
  let totalJoints   = 0;
  let totalRoomArea = 0;
  let html          = '';

  rooms.forEach(room => {
    // Convert canvas-pixel room to metre room for calcRoom()
    const metreRoom = {
      name:        room.name,
      length:      room.width  / ppm,  // canvas width px  → length m
      width:       room.height / ppm,  // canvas height px → width m
      orientation: room.orientation || 'auto'
    };

    const res = calcRoom(metreRoom, rollWidth, roundTo, offcuts);
    if (!res) {
      html += `<div class="room-card"><h3>${room.name}</h3><p style="color:#999">Room has no dimensions.</p></div>`;
      return;
    }

    totalLen      += res.roomLen;
    totalJoints   += res.joints;

    const roomArea   = metreRoom.length * metreRoom.width;
    totalRoomArea   += roomArea;
    const carpetArea = res.carpetArea;
    const wasteArea  = Math.max(0, carpetArea - roomArea);
    const roomCost   = res.roomLen * pricePerLinM;

    const jointsClass = res.joints === 0 ? 'joints-0' : res.joints === 1 ? 'joints-1' : 'joints-2p';
    const jointsLabel = res.joints === 0 ? '0 \u2014 seamless' : res.joints;

    html += `
      <div class="room-card">
        <h3>${room.name} &mdash; ${fmt(metreRoom.length)} &times; ${fmt(metreRoom.width)} m</h3>
        <div class="stats">
          <div class="stat ${jointsClass}">
            <div class="lbl">Joints / Seams</div>
            <div class="val">${jointsLabel}</div>
          </div>
          <div class="stat">
            <div class="lbl">Drops</div>
            <div class="val">${res.drops}</div>
          </div>
          <div class="stat">
            <div class="lbl">Direction</div>
            <div class="val">${res.orientLabel}</div>
          </div>
          <div class="stat">
            <div class="lbl">Roll Length Used</div>
            <div class="val">${fmt(res.roomLen)} m</div>
          </div>
          <div class="stat">
            <div class="lbl">Floor Area</div>
            <div class="val">${fmt(roomArea)} m&sup2;</div>
          </div>
          <div class="stat">
            <div class="lbl">Carpet Cut Area</div>
            <div class="val">${fmt(carpetArea)} m&sup2;</div>
          </div>
          <div class="stat">
            <div class="lbl">Offcut Waste</div>
            <div class="val">${fmt(wasteArea)} m&sup2;</div>
          </div>
          ${pricePerSqm > 0 ? `
          <div class="stat">
            <div class="lbl">Room Carpet Cost</div>
            <div class="val">${fmtGBP(roomCost)}</div>
          </div>` : ''}
        </div>
        ${res.offcutUsed      ? `<div class="info-strip info-green">&#10003; Offcut reused: ${res.offcutUsed}</div>` : ''}
        ${res.offcutGenerated ? `<div class="info-strip info-amber">&#10003; Offcut stored (${fmt(res.offcutGenerated.width)}&times;${fmt(res.offcutGenerated.length)} m) &mdash; available for later rooms</div>` : ''}
      </div>`;
  });

  const totalCarpetCost = totalLen * pricePerLinM;
  const grandTotal      = totalCarpetCost + fittingCost;
  const totalCarpetArea = totalLen * rollWidth;

  let summaryHtml = `
    <div class="summary-bar">
      <div class="sum-stat"><div class="lbl">Total Roll Length</div><div class="val">${fmt(totalLen)} m</div></div>
      <div class="sum-stat"><div class="lbl">Total Floor Area</div><div class="val">${fmt(totalRoomArea)} m&sup2;</div></div>
      <div class="sum-stat"><div class="lbl">Carpet Area Bought</div><div class="val">${fmt(totalCarpetArea)} m&sup2;</div></div>
      <div class="sum-stat"><div class="lbl">Total Joints</div><div class="val">${totalJoints}</div></div>`;

  if (pricePerSqm > 0) {
    summaryHtml += `<div class="sum-stat"><div class="lbl">Carpet Material</div><div class="val">${fmtGBP(totalCarpetCost)}</div></div>`;
    if (fittingCost > 0) {
      summaryHtml += `
        <div class="sum-stat"><div class="lbl">Fitting</div><div class="val">${fmtGBP(fittingCost)}</div></div>
        <div class="sum-stat"><div class="lbl">Total (inc. fitting)</div><div class="val">${fmtGBP(grandTotal)}</div></div>`;
    }
    summaryHtml += `<div class="sum-stat"><div class="lbl">Effective Price / m&sup2;</div><div class="val">${fmtGBP(totalRoomArea > 0 ? grandTotal / totalRoomArea : 0)}</div></div>`;
  }
  summaryHtml += `</div>`;

  let offcutNote = '';
  if (offcuts.length) {
    offcutNote = `<div class="offcut-note"><strong>Stored offcuts (${offcuts.length}):</strong> ` +
      offcuts.map(o => `${o.from}: ${fmt(o.width)}&times;${fmt(o.length)} m`).join(' &nbsp;|&nbsp; ') +
      '</div>';
  }

  const jobRef    = (document.getElementById('jobRef').value || '').trim();
  const printDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const printHeader = `
    <div class="print-only print-header">
      <div>
        <h2>Carpet Installation Plan</h2>
        ${jobRef ? `<div style="font-size:10pt;color:#555;margin-top:0.2rem">${jobRef}</div>` : ''}
      </div>
      <div class="ph-meta">
        Date: ${printDate}<br>
        Roll width: ${rollWidth} m<br>
        ${pricePerSqm > 0 ? `Price: &pound;${pricePerSqm.toFixed(2)}/m&sup2;<br>` : ''}
        ${fittingCost  > 0 ? `Fitting: &pound;${fittingCost.toFixed(2)}<br>`       : ''}
        Generated by Carpet Planner
      </div>
    </div>`;

  const printBtn = `
    <div class="no-print" style="margin-top:0.75rem">
      <button class="btn-print" onclick="window.print()">&#128438; Print / Save PDF</button>
    </div>`;

  document.getElementById('results').innerHTML =
    `<div class="result">${printHeader}${html}${summaryHtml}${offcutNote}${printBtn}</div>`;
}

function resetOffcuts() {
  document.getElementById('results').innerHTML =
    '<div class="result"><p style="color:#6b7280;padding:8px">Offcuts cleared. Click Calculate to refresh.</p></div>';
}

// ─── combineRooms (canvas feature) ────────────────────────────────────────────

function combineRooms(roomId1, roomId2) {
  const r1 = rooms.find(r => r.id === roomId1);
  const r2 = rooms.find(r => r.id === roomId2);
  if (!r1 || !r2) return;

  const originalR1 = JSON.parse(JSON.stringify(r1));
  const originalR2 = JSON.parse(JSON.stringify(r2));

  const minX = Math.min(r1.x, r2.x);
  const minY = Math.min(r1.y, r2.y);
  const maxX = Math.max(r1.x + r1.width, r2.x + r2.width);
  const maxY = Math.max(r1.y + r1.height, r2.y + r2.height);

  const combinedRoom = {
    id: Date.now(),
    name: `${r1.name} + ${r2.name}`,
    x: minX, y: minY,
    width: maxX - minX, height: maxY - minY,
    orientation: 'auto',
    color: r1.color,
    doors: [...r1.doors, ...r2.doors],
    isCombined: true,
    originalRoomData: [originalR1, originalR2]
  };

  rooms = rooms.filter(r => r.id !== roomId1 && r.id !== roomId2);
  rooms.push(combinedRoom);
  selectedRoom = combinedRoom;
  updateRoomsList();
  draw();
  calculate();
}
