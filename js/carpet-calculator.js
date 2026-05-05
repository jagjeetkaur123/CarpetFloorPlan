// Carpet calculation helpers

function roundUp(val, step) {
  if (!step || step <= 0) return val;
  return Math.ceil(val / step) * step;
}

function fmt(n)    { return n.toFixed(2); }
function fmtGBP(n) { return '\u00a3' + n.toFixed(2); }

// ─── Orientation helper ────────────────────────────────────────────────────────
function getRoomOrientInfo(room, rollWidth) {
  const L = room.length, W = room.width;
  const dropsAlongLength = Math.ceil(W / rollWidth); // run along L, across W
  const dropsAlongWidth  = Math.ceil(L / rollWidth); // run along W, across L

  let runSide, acrossSide, totalDrops, orientLabel;

  if (!room.orientation || room.orientation === 'auto') {
    const lenA = dropsAlongLength * L;
    const lenB = dropsAlongWidth  * W;
    if (dropsAlongLength < dropsAlongWidth ||
        (dropsAlongLength === dropsAlongWidth && lenA <= lenB)) {
      runSide = L; acrossSide = W; totalDrops = dropsAlongLength; orientLabel = 'along length';
    } else {
      runSide = W; acrossSide = L; totalDrops = dropsAlongWidth;  orientLabel = 'along width';
    }
  } else if (room.orientation === 'length') {
    runSide = L; acrossSide = W; totalDrops = dropsAlongLength; orientLabel = 'along length';
  } else {
    runSide = W; acrossSide = L; totalDrops = dropsAlongWidth;  orientLabel = 'along width';
  }

  return { runSide, acrossSide, totalDrops, orientLabel };
}

// ─── Optimisation finder ───────────────────────────────────────────────────────
// Detects when extending a room's cut length allows a later narrow room to be
// cut from the offcut instead of buying new carpet.
// Returns: { donorIndex: { extendTo, beneficiaryIndex, beneficiaryName, savingM } }
function findOptimisations(metreRooms, rollWidth, roundTo) {
  const opts = {};

  for (let i = 0; i < metreRooms.length; i++) {
    const roomA = metreRooms[i];
    if (!roomA.length || !roomA.width) continue;

    const { runSide: runA, acrossSide: acrossA, totalDrops: dropsA } = getRoomOrientInfo(roomA, rollWidth);
    const offcutW  = dropsA * rollWidth - acrossA;
    if (offcutW <= 0.05) continue; // Room A produces no useful offcut

    const currentA = roundUp(runA, roundTo);

    for (let j = i + 1; j < metreRooms.length; j++) {
      const roomB = metreRooms[j];
      if (!roomB.length || !roomB.width) continue;

      const { runSide: runB, acrossSide: acrossB, totalDrops: dropsB } = getRoomOrientInfo(roomB, rollWidth);
      const extendTo = roundUp(runB, roundTo);

      // Room B must fit in offcut width, and extension must actually increase Room A's run
      if (offcutW >= acrossB && extendTo > currentA) {
        const extraA   = roundUp(dropsA * extendTo, roundTo) - roundUp(dropsA * currentA, roundTo);
        const normalB  = roundUp(dropsB * runB, roundTo);
        const savingM  = normalB - extraA;

        if (savingM > 0.01) {
          // Keep only the best (highest saving) optimisation per donor room
          if (!opts[i] || savingM > opts[i].savingM) {
            opts[i] = { extendTo, beneficiaryIndex: j, beneficiaryName: roomB.name, savingM };
          }
        }
      }
    }
  }

  return opts;
}

// ─── Cross-cut / split-join helper ───────────────────────────────────────────
// Instead of buying a full-length drop for the narrow last strip, buy shorter
// pieces (= narrowStripWidth metres off the roll) and rotate them 90° to
// assemble the strip lengthwise.  One extra seam per additional piece.
// Returns { numPieces, crossCutLen, saved, extraJoins } or null if no saving.
function calcCrossCut(narrowStrip, runSide, rollWidth, roundTo) {
  if (narrowStrip <= 0.001) return null;
  const numPieces    = Math.ceil(runSide / rollWidth);
  const crossCutLen  = numPieces * roundUp(narrowStrip, roundTo);
  const standardLen  = roundUp(runSide, roundTo);
  const saved        = parseFloat((standardLen - crossCutLen).toFixed(3));
  if (saved <= 0.01) return null;
  return { numPieces, crossCutLen, saved, extraJoins: numPieces - 1 };
}

// ─── Core room calculator ─────────────────────────────────────────────────────
// minRunLength: optionally extend the run side (used by optimisation)
// wastePerDrop: extra metres added per fresh-roll drop for trimming allowance
function calcRoom(room, rollWidth, roundTo, offcuts, minRunLength = 0, wastePerDrop = 0) {
  const L = room.length, W = room.width;
  if (!L || !W) return null;

  const { runSide: naturalRun, acrossSide, orientLabel } = getRoomOrientInfo(room, rollWidth);

  // Apply extension if optimisation requested
  const runSide = (minRunLength > naturalRun) ? roundUp(minRunLength, roundTo) : naturalRun;
  const wasExtended = runSide > naturalRun;

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
        orientLabel, extended: false, naturalRoomLen: 0
      };
    }

    // Offcut covers the partial last drop
    const fullDrops   = Math.floor(acrossSide / rollWidth);
    const leftoverGap = acrossSide - fullDrops * rollWidth;
    if (leftoverGap > 0.001 && strip.width >= leftoverGap && strip.length >= runSide) {
      const surplusW = strip.width - leftoverGap;
      offcuts.splice(i, 1);
      if (surplusW > 0.05) offcuts.push({ from: strip.from, width: surplusW, length: strip.length });
      const roomLen    = roundUp(fullDrops * (runSide + wastePerDrop), roundTo);
      const carpetArea = fullDrops * rollWidth * runSide + leftoverGap * runSide;
      const surplus    = surplusW > 0.05 ? `, ${fmt(surplusW)}m surplus re-stored` : '';
      return {
        roomLen, joints: fullDrops, drops: fullDrops + 1,
        carpetArea,
        offcutUsed: `Last drop (${fmt(leftoverGap)}m) from offcut [${strip.from}]${surplus}`,
        offcutGenerated: null,
        orientLabel, extended: false, naturalRoomLen: 0
      };
    }
  }

  const totalDrops     = Math.ceil(acrossSide / rollWidth);
  const fullDrops      = Math.floor(acrossSide / rollWidth);
  const leftoverGap    = acrossSide - fullDrops * rollWidth;   // width of narrow last strip
  const joints         = totalDrops - 1;
  const leftoverW      = totalDrops * rollWidth - acrossSide;  // offcut width from last drop
  const naturalRoomLen = roundUp(totalDrops * (naturalRun + wastePerDrop), roundTo);

  // ── Cross-cut / split-join ─────────────────────────────────────────────────
  // When the customer opts in (room.splitJoin === true) and there IS a narrow
  // last strip, replace that full drop with rotated shorter pieces.
  if (room.splitJoin && leftoverGap > 0.001) {
    const xc = calcCrossCut(leftoverGap, runSide, rollWidth, roundTo);
    if (xc) {
      const fullDropLen = roundUp(fullDrops * (runSide + wastePerDrop), roundTo);
      const roomLen     = fullDropLen + xc.crossCutLen;
      const carpetArea  = fullDropLen * rollWidth + leftoverGap * runSide;

      let offcutGenerated = null;
      if (leftoverW > 0.05) {
        offcutGenerated = { from: room.name, width: leftoverW, length: runSide };
        offcuts.push(offcutGenerated);
      }

      return {
        roomLen, joints: joints + xc.extraJoins, drops: totalDrops, carpetArea,
        offcutUsed: null, offcutGenerated, orientLabel,
        extended: wasExtended, naturalRoomLen,
        narrowStripW: leftoverGap, runSideUsed: runSide,
        splitJoin: xc,
      };
    }
  }
  // ── End cross-cut ──────────────────────────────────────────────────────────

  const roomLen    = roundUp(totalDrops * (runSide + wastePerDrop), roundTo);
  const carpetArea = roomLen * rollWidth;

  let offcutGenerated = null;
  if (leftoverW > 0.05) {
    offcutGenerated = { from: room.name, width: leftoverW, length: runSide };
    offcuts.push(offcutGenerated);
  }

  const narrowStripW = leftoverGap > 0.001 ? leftoverGap : 0;

  return {
    roomLen, joints, drops: totalDrops, carpetArea,
    offcutUsed: null, offcutGenerated, orientLabel,
    extended: wasExtended, naturalRoomLen,
    narrowStripW, runSideUsed: runSide,
    splitJoin: null,
  };
}

// ─── Cut layout diagram (SVG) ─────────────────────────────────────────────────
function generateCutDiagramSVG(metreRoom, res, rollWidth, idx) {
  const { runSide, acrossSide, totalDrops } = getRoomOrientInfo(metreRoom, rollWidth);

  const MAX_W = 220, MAX_H = 130;
  const sc = Math.min(MAX_W / runSide, MAX_H / acrossSide);
  const rW = +(runSide * sc).toFixed(1);
  const rH = +(acrossSide * sc).toFixed(1);
  const SVG_H = rH + 22;

  const fills = ['#dbeafe', '#bfdbfe'];
  let body = '';

  for (let d = 0; d < totalDrops; d++) {
    const y1 = +(d * rollWidth * sc).toFixed(1);
    const y2 = d < totalDrops - 1 ? +((d + 1) * rollWidth * sc).toFixed(1) : rH;
    const h  = +(y2 - y1).toFixed(1);
    body += `<rect x="0" y="${y1}" width="${rW}" height="${h}" fill="${fills[d % 2]}"/>`;
    if (d > 0) {
      body += `<line x1="0" y1="${y1}" x2="${rW}" y2="${y1}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4,3"/>`;
    }
    const midY = +((y1 + y2) / 2).toFixed(1);
    const lastW = acrossSide % rollWidth || rollWidth;
    const wLabel = d < totalDrops - 1 ? fmt(rollWidth) : fmt(lastW);
    body += `<text x="${(rW / 2).toFixed(1)}" y="${midY}" dy="0.35em" text-anchor="middle" font-size="7" fill="#1e40af" font-family="Arial">D${d + 1}: ${wLabel}m</text>`;
  }

  const uid = `ra${idx}`;
  const arrY = (rH / 2).toFixed(1);

  body += `
    <rect x="0" y="0" width="${rW}" height="${rH}" fill="none" stroke="#1e3a5f" stroke-width="1.5"/>
    <defs><marker id="${uid}" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
      <path d="M0,0 L0,5 L6,2.5 z" fill="#1d4ed8"/>
    </marker></defs>
    <line x1="10" y1="${arrY}" x2="${(rW - 10).toFixed(1)}" y2="${arrY}" stroke="#1d4ed8" stroke-width="1.2" marker-end="url(#${uid})" opacity="0.55"/>
    <text x="${(rW / 2).toFixed(1)}" y="${(rH + 14).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#374151" font-family="Arial">${runSide.toFixed(2)}m run × ${acrossSide.toFixed(2)}m across</text>`;

  return `<svg width="${rW}" height="${SVG_H}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
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
  const wastePerCut  = parseFloat(document.getElementById('wastePerCut').value)  || 0;
  const pricePerSqm  = parseFloat(document.getElementById('pricePerSqm').value)  || 0;
  const fittingCost  = parseFloat(document.getElementById('fittingCost').value)  || 0;
  const pricePerLinM = pricePerSqm * rollWidth;

  // Clear any previous offcut link annotations so the canvas starts fresh
  rooms.forEach(r => { r.offcutInfo = null; r.isOffcutDonor = null; });

  // Build metre rooms array first so we can run optimisation pre-scan
  const metreRooms = rooms.map(room => ({
    name:        room.name,
    length:      room.width  / ppm,
    width:       room.height / ppm,
    orientation: room.orientation || 'auto',
    splitJoin:   !!room.splitJoin,
  }));

  // Find optimisation opportunities before processing
  const optimisations = findOptimisations(metreRooms, rollWidth, roundTo);

  // Capture floor plan from canvas for the print report
  const canvasEl = document.getElementById('canvas');
  const floorPlanDataUrl = canvasEl.toDataURL('image/png');

  const offcuts     = [];
  let totalLen      = 0;
  let totalJoints   = 0;
  let totalRoomArea = 0;
  let totalSavingM  = 0;
  let html          = '';
  const tableData   = [];

  metreRooms.forEach((metreRoom, idx) => {
    const opt    = optimisations[idx];
    const minRun = opt ? opt.extendTo : 0;
    const res    = calcRoom(metreRoom, rollWidth, roundTo, offcuts, minRun, wastePerCut);

    if (!res) {
      html += `<div class="room-card"><h3>${metreRoom.name}</h3><p style="color:#999">Room has no dimensions.</p></div>`;
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

    tableData.push({ metreRoom, res, roomArea, carpetArea, wasteArea, roomCost, jointsLabel });

    // Optimisation note for donor room
    let optNote = '';
    if (opt && res.extended) {
      const savingCost = opt.savingM * pricePerLinM;
      totalSavingM += opt.savingM;
      const extraLen = res.roomLen - res.naturalRoomLen;
      optNote = `<div class="info-strip info-green">
        &#9889; <strong>Optimised:</strong> cut extended by ${fmt(extraLen)}m
        (${fmt(res.naturalRoomLen)}m &rarr; ${fmt(res.roomLen)}m) so
        <strong>${opt.beneficiaryName}</strong> can be cut from the offcut
        ${pricePerSqm > 0 ? `&mdash; saves ${fmtGBP(savingCost)}` : `&mdash; saves ${fmt(opt.savingM)}m of roll`}
      </div>`;
    }

    // ── Cross-cut option ──────────────────────────────────────────────────────
    // When the last drop is a narrow strip, the customer can rotate a short
    // piece of roll 90° (cross-grain) instead of buying a full-length drop.
    // This saves carpet but the pile direction will differ — offer as option only.
    let crossCutNote = '';
    if (res.narrowStripW > 0.05 && !res.offcutUsed && !res.splitJoin) {
      const strip      = res.narrowStripW;           // narrow strip width (m)
      const runS       = res.runSideUsed;            // carpet run length (m)
      const numPieces  = Math.ceil(runS / rollWidth); // pieces needed end-to-end
      const crossCutLen = numPieces * roundUp(strip, roundTo); // total roll metres
      const standardLen = roundUp(runS, roundTo);    // metres for a normal full drop
      const saving      = standardLen - crossCutLen;

      if (saving > 0.05) {
        const savingCost    = saving * pricePerLinM;
        const extraJoins    = numPieces - 1; // extra butt-joins within the strip
        const joinsWarning  = extraJoins > 0
          ? ` (needs ${extraJoins} extra butt-join${extraJoins > 1 ? 's' : ''} within the strip)`
          : '';

        crossCutNote = `<div class="info-strip info-teal">
          &#9986; <strong>Customer option &mdash; cross-cut last strip:</strong>
          The ${fmt(strip)}m strip only needs ${fmt(strip)}m of roll width.
          Buy just ${numPieces > 1 ? numPieces + '&times;' : ''}${fmt(roundUp(strip, roundTo))}m
          of roll and rotate it 90&deg; &mdash; saves
          ${pricePerSqm > 0 ? fmtGBP(savingCost) : fmt(saving) + 'm of roll'}${joinsWarning}.
          <br><em>&#9888; Pile direction will differ at this seam &mdash; confirm with customer before cutting.</em>
        </div>`;
      }
    }
    const diagramSvg = generateCutDiagramSVG(metreRoom, res, rollWidth, idx);

    html += `
      <div class="room-card">
        <h3>${metreRoom.name} &mdash; ${fmt(metreRoom.length)} &times; ${fmt(metreRoom.width)} m</h3>
        <div class="room-card-body">
          <div class="room-card-stats">
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
                <div class="val">${res.offcutUsed ? 'from offcut' : fmt(res.roomLen) + ' m'}</div>
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
                <div class="val">${res.offcutUsed ? '(offcut)' : fmtGBP(roomCost)}</div>
              </div>` : ''}
            </div>
            ${optNote}
            ${res.offcutUsed      ? `<div class="info-strip info-green">&#10003; Offcut reused: ${res.offcutUsed}</div>` : ''}
            ${res.offcutGenerated ? `<div class="info-strip info-amber">&#10003; Offcut stored (${fmt(res.offcutGenerated.width)}&times;${fmt(res.offcutGenerated.length)} m) &mdash; available for later rooms</div>` : ''}
            ${crossCutNote}
            ${res.splitJoin ? `
              <div class="info-strip info-purple">
                &#9986; <strong>Cross-cut applied &mdash; customer saving option ON:</strong>
                The ${fmt(res.narrowStripW)}m last strip is cut from
                ${res.splitJoin.numPieces > 1 ? res.splitJoin.numPieces + '&times;' : ''}${fmt(roundUp(res.narrowStripW, roundTo))}m
                pieces rotated 90&deg; instead of one full-length drop &mdash;
                saves <strong>${fmt(res.splitJoin.saved)}m of roll${pricePerSqm > 0 ? ` (${fmtGBP(res.splitJoin.saved * pricePerLinM)})` : ''}</strong>.
                ${res.splitJoin.extraJoins > 0 ? `<br>${res.splitJoin.extraJoins} extra butt-join${res.splitJoin.extraJoins > 1 ? 's' : ''} within the strip.` : ''}
                <br><em>&#9888; Pile direction will differ at this seam &mdash; confirm with customer. Best for plain or loop-pile carpet.</em>
              </div>` : ''}
          </div>
          <div class="room-card-diagram print-only">
            <div class="diagram-title">Cut Layout</div>
            ${diagramSvg}
            <div class="diagram-legend">
              <span class="leg-drop"></span> D1&nbsp;
              <span class="leg-drop leg-alt"></span> D2&nbsp;
              <span class="leg-seam"></span> Seam&nbsp;
              <span class="leg-arrow">&#8594;</span> Run
            </div>
          </div>
        </div>
      </div>`;
  });

  const totalCarpetCost = totalLen * pricePerLinM;
  const grandTotal      = totalCarpetCost + fittingCost;
  const totalCarpetArea = totalLen * rollWidth;
  const totalSavingCost = totalSavingM * pricePerLinM;

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

  if (totalSavingM > 0) {
    const savingDisplay = pricePerSqm > 0 ? fmtGBP(totalSavingCost) : `${fmt(totalSavingM)} m`;
    summaryHtml += `<div class="sum-stat saving-stat"><div class="lbl">&#9889; Optimisation Saving</div><div class="val">${savingDisplay}</div></div>`;
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
        Waste per cut: ${fmt(wastePerCut)} m<br>
        ${pricePerSqm > 0 ? `Price: &pound;${pricePerSqm.toFixed(2)}/m&sup2;<br>` : ''}
        ${fittingCost  > 0 ? `Fitting: &pound;${fittingCost.toFixed(2)}<br>`       : ''}
        Generated by Carpet Planner
      </div>
    </div>`;

  // ── Floor plan section (print-only) ────────────────────────────────────────
  const floorPlanSection = `
    <div class="print-only print-section">
      <h3 class="print-section-title">&#9635; Floor Plan</h3>
      <div class="print-floor-plan">
        <img src="${floorPlanDataUrl}" alt="Floor Plan">
      </div>
    </div>`;

  // ── Cutting schedule table (print-only) ─────────────────────────────────────
  let scheduleRows = '';
  tableData.forEach(({ metreRoom, res, roomArea, carpetArea, wasteArea, roomCost, jointsLabel }) => {
    const rollUsed = res.offcutUsed ? 'Offcut' : `${fmt(res.roomLen)} m`;
    const costCell = pricePerSqm > 0 ? `<td>${res.offcutUsed ? '&mdash;' : fmtGBP(roomCost)}</td>` : '';
    scheduleRows += `<tr>
      <td>${metreRoom.name}</td>
      <td>${fmt(metreRoom.length)} &times; ${fmt(metreRoom.width)}</td>
      <td>${res.orientLabel}</td>
      <td>${res.drops}</td>
      <td>${jointsLabel}</td>
      <td>${rollUsed}</td>
      <td>${fmt(roomArea)} m&sup2;</td>
      <td>${fmt(carpetArea)} m&sup2;</td>
      <td>${fmt(wasteArea)} m&sup2;</td>
      ${costCell}
    </tr>`;
  });

  const totalCarpetArea2 = totalLen * rollWidth;
  const scheduleTable = `
    <div class="print-only print-section">
      <h3 class="print-section-title">&#9986; Cutting Schedule</h3>
      <table class="cutting-schedule">
        <thead>
          <tr>
            <th>Room</th><th>Size (m)</th><th>Direction</th><th>Drops</th><th>Joints</th>
            <th>Roll Used</th><th>Floor Area</th><th>Cut Area</th><th>Waste</th>
            ${pricePerSqm > 0 ? '<th>Cost</th>' : ''}
          </tr>
        </thead>
        <tbody>${scheduleRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="5" class="sched-total-label">Totals</td>
            <td>${fmt(totalLen)} m</td>
            <td>${fmt(totalRoomArea)} m&sup2;</td>
            <td>${fmt(totalCarpetArea2)} m&sup2;</td>
            <td>${fmt(Math.max(0, totalCarpetArea2 - totalRoomArea))} m&sup2;</td>
            ${pricePerSqm > 0 ? `<td>${fmtGBP(totalCarpetCost)}</td>` : ''}
          </tr>
        </tfoot>
      </table>
    </div>`;

  const printBtn = `
    <div class="no-print" style="margin-top:0.75rem">
      <button class="btn-print" onclick="window.print()">&#128438; Print / Save PDF</button>
    </div>`;

  document.getElementById('results').innerHTML =
    `<div class="result">${printHeader}${floorPlanSection}${scheduleTable}${html}${summaryHtml}${offcutNote}${printBtn}</div>`;
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
