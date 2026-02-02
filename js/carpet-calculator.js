// Carpet calculation functions (from original code)

function roundUp(val, step) {
  return Math.ceil(val / step) * step;
}

// Detect adjacent rooms that can be combined for carpet calculation
function findAdjacentRooms() {
  const adjacentPairs = [];
  const tolerance = 20; // pixels tolerance for edge detection (increased for better detection)

  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const r1 = rooms[i];
      const r2 = rooms[j];

      // Check if rooms share an edge (adjacent)
      const shareTop = Math.abs(r1.y - (r2.y + r2.height)) < tolerance;
      const shareBottom = Math.abs((r1.y + r1.height) - r2.y) < tolerance;
      const shareLeft = Math.abs(r1.x - (r2.x + r2.width)) < tolerance;
      const shareRight = Math.abs((r1.x + r1.width) - r2.x) < tolerance;

      // Check if they overlap in the perpendicular direction
      const overlapX = (r1.x < r2.x + r2.width - tolerance) && (r2.x < r1.x + r1.width - tolerance);
      const overlapY = (r1.y < r2.y + r2.height - tolerance) && (r2.y < r1.y + r1.height - tolerance);

      console.log(`Checking ${r1.name} vs ${r2.name}:`, {
        shareTop, shareBottom, shareLeft, shareRight,
        overlapX, overlapY
      });

      if ((shareTop || shareBottom) && overlapX) {
        console.log(`✓ Found vertical adjacency: ${r1.name} + ${r2.name}`);
        adjacentPairs.push({
          rooms: [r1, r2],
          direction: 'vertical',
          savings: 0
        });
      } else if ((shareLeft || shareRight) && overlapY) {
        console.log(`✓ Found horizontal adjacency: ${r1.name} + ${r2.name}`);
        adjacentPairs.push({
          rooms: [r1, r2],
          direction: 'horizontal',
          savings: 0
        });
      }
    }
  }

  console.log(`Found ${adjacentPairs.length} adjacent room pairs`);
  return adjacentPairs;
}

// Calculate combined area for adjacent rooms
function calculateCombinedArea(roomPair) {
  const ppm = getPxPerMeter();
  const [r1, r2] = roomPair.rooms;
  
  // Calculate bounding box of combined rooms
  const minX = Math.min(r1.x, r2.x);
  const minY = Math.min(r1.y, r2.y);
  const maxX = Math.max(r1.x + r1.width, r2.x + r2.width);
  const maxY = Math.max(r1.y + r1.height, r2.y + r2.height);
  
  const combinedWidth = (maxX - minX) / ppm;
  const combinedHeight = (maxY - minY) / ppm;
  
  return {
    width: combinedWidth,
    height: combinedHeight,
    area: combinedWidth * combinedHeight,
    name: `${r1.name} + ${r2.name}`
  };
}

// Calculate savings from combining rooms
function calculateSavings(adjacentPairs, rollWidth, roundTo) {
  const offcutsSeparate = [];
  const offcutsCombined = [];
  
  adjacentPairs.forEach(pair => {
    // Calculate separate
    let separateTotal = 0;
    pair.rooms.forEach(room => {
      const res = calcRoom(room, rollWidth, roundTo, offcutsSeparate);
      separateTotal += res.roomLen;
    });
    
    // Calculate combined
    const combined = calculateCombinedArea(pair);
    const combinedRoom = {
      width: combined.width * getPxPerMeter(),
      height: combined.height * getPxPerMeter(),
      orientation: combined.width > combined.height ? 'length' : 'width',
      name: combined.name
    };
    const resCombined = calcRoom(combinedRoom, rollWidth, roundTo, offcutsCombined);
    
    pair.savings = separateTotal - resCombined.combinedLen;
    pair.separateTotal = separateTotal;
    pair.combinedTotal = resCombined.roomLen;
  });
  
  return adjacentPairs.filter(pair => pair.savings > 0.1); // Only show if savings > 0.1m
}

function calcRoom(room, rollWidth, roundTo, offcuts) {
  const ppm = getPxPerMeter();
  const L = room.width / ppm;
  const W = room.height / ppm;
  let runSide, acrossSide;

  if (room.orientation === 'length') {
    runSide = L;
    acrossSide = W;
  } else {
    runSide = W;
    acrossSide = L;
  }

  let drops = Math.floor(acrossSide / rollWidth);
  let totalLen = drops * runSide;
  let leftoverWidth = acrossSide - drops * rollWidth;

  // REUSE LOGIC
  for (let i = 0; i < offcuts.length; i++) {
    const strip = offcuts[i];

    if (strip.width >= acrossSide && strip.length >= runSide) {
      let note = `Filled using offcut from ${strip.from} (${strip.width.toFixed(2)}×${strip.length.toFixed(2)}).`;
      let wastageStrips = "No new wastage, reused existing strip.";
      let remainderNote = `Remainder strip from ${strip.from} consumed.`;
      offcuts.splice(i, 1);
      return {roomLen:0, reused:true, note, wastageStrips, remainderNote};
    }

    if (strip.width >= leftoverWidth && strip.length >= runSide && leftoverWidth > 0) {
      let note = `Gap ${leftoverWidth.toFixed(2)}×${runSide.toFixed(2)} filled using offcut from ${strip.from} (${strip.width.toFixed(2)}×${strip.length.toFixed(2)}).`;
      let wastageStrips = "No new wastage, reused existing strip.";
      let remainderNote = `Remainder strip from ${strip.from} consumed.`;
      offcuts.splice(i, 1);
      return {roomLen:roundUp(runSide, roundTo), reused:true, note, wastageStrips, remainderNote};
    }
  }

  let note = `${drops} drop${drops!==1?'s':''} required (each ${runSide.toFixed(2)} m).`;
  let wastageStrips = "";
  let remainderNote = "";

  if (acrossSide <= rollWidth) {
    totalLen = runSide;
    leftoverWidth = rollWidth - acrossSide;
    if (leftoverWidth > 0) {
      note = `Leftover ${leftoverWidth.toFixed(2)} m → full drop ${runSide.toFixed(2)} m.`;
      wastageStrips = `One full drop used, offcut width ${leftoverWidth.toFixed(2)} × ${runSide.toFixed(2)} m.`;
      offcuts.push({from:room.name,width:leftoverWidth,length:runSide});
      remainderNote = `Remainder strip stored: ${leftoverWidth.toFixed(2)}×${runSide.toFixed(2)} m.`;
    } else {
      note = "No leftover, exact fit.";
      wastageStrips = "No wastage strip required.";
      remainderNote = "No remainder strip.";
    }
  } else if (leftoverWidth > 0) {
    if (leftoverWidth <= 1.0) {
      let shortLen = runSide * (leftoverWidth / rollWidth);
      let cutLen = shortLen * 2;
      totalLen += cutLen;

      note = `Leftover ${leftoverWidth.toFixed(2)} m covered by cutting ${cutLen.toFixed(2)} m piece.`;
      wastageStrips = `Cut ${cutLen.toFixed(2)} m → split into 2 strips (${shortLen.toFixed(2)}×${rollWidth.toFixed(2)} each). Joined side-by-side to cover ${leftoverWidth.toFixed(2)}×${runSide.toFixed(2)} space.`;
      remainderNote = "No remainder strip stored (short piece consumed).";
    } else {
      totalLen += runSide;
      note = `Leftover ${leftoverWidth.toFixed(2)} m → full drop ${runSide.toFixed(2)} m.`;
      wastageStrips = `One full drop used, offcut width ${leftoverWidth.toFixed(2)} × ${runSide.toFixed(2)} m.`;
      offcuts.push({from:room.name,width:leftoverWidth,length:runSide});
      remainderNote = `Remainder strip stored: ${(rollWidth-leftoverWidth).toFixed(2)}×${runSide.toFixed(2)} m.`;
    }
  } else {
    wastageStrips = "No wastage strip required.";
    remainderNote = "No remainder strip.";
  }

  totalLen = roundUp(totalLen, roundTo);
  return {roomLen:totalLen, reused:false, note, wastageStrips, remainderNote};
}

function calculate() {
  if (rooms.length === 0) {
    alert('Please add some rooms first!');
    return;
  }

  const rollWidth = parseFloat(document.getElementById('rollWidth').value);
  const roundTo = parseFloat(document.getElementById('roundTo').value);
  const ppm = getPxPerMeter();
  
  let total = 0;
  let html = '<div class="results"><h3>📊 Results</h3>';
  let offcuts = [];

  // Check for adjacent rooms
  const adjacentPairs = findAdjacentRooms();
  
  // Show combination suggestions if found
  if (adjacentPairs.length > 0) {
    html += '<div class="optimization-banner">';
    html += '<h4>💡 Smart Optimization Detected!</h4>';
    html += '<p>Some rooms are adjacent. Combining them can save carpet:</p>';
    
    adjacentPairs.forEach((pair, index) => {
      const [r1, r2] = pair.rooms;
      const combined = calculateCombinedArea(pair);
      
      // Calculate separate
      const offcutsSep = [];
      const res1 = calcRoom(r1, rollWidth, roundTo, offcutsSep);
      const res2 = calcRoom(r2, rollWidth, roundTo, offcutsSep);
      const separateTotal = res1.roomLen + res2.roomLen;
      
      // Calculate combined
      const combinedRoom = {
        width: combined.width * ppm,
        height: combined.height * ppm,
        orientation: combined.width > combined.height ? 'length' : 'width',
        name: combined.name
      };
      const resCombined = calcRoom(combinedRoom, rollWidth, roundTo, []);
      const savings = separateTotal - resCombined.roomLen;
      
      if (savings > 0.1) {
        html += `
          <div class="suggestion-item">
            <strong>${r1.name} + ${r2.name}</strong><br>
            <small>
              Separate: ${separateTotal.toFixed(2)}m | 
              Combined: ${resCombined.roomLen.toFixed(2)}m | 
              <span style="color: #27ae60; font-weight: bold;">💰 Save ${savings.toFixed(2)}m!</span>
            </small><br>
            <button class="btn-combine" onclick="combineRooms(${r1.id}, ${r2.id})">
              ✨ Combine These Rooms
            </button>
          </div>
        `;
      }
    });
    
    html += '</div>';
  }

  // Standard calculation
  rooms.forEach(room => {
    const res = calcRoom(room, rollWidth, roundTo, offcuts);
    total += res.roomLen;

    const L = (room.width / ppm).toFixed(2);
    const W = (room.height / ppm).toFixed(2);

    html += `
      <div class="result-item">
        <strong>${room.name}:</strong> ${L} × ${W} m → ${res.roomLen.toFixed(2)} m used<br>
        <small>📌 ${res.note}</small><br>
        <small>♻️ ${res.wastageStrips}</small><br>
        <small>📦 ${res.remainderNote}</small>
      </div>
    `;
  });

  const withWastage = total * 1.10;
  
  html += `
    <div class="total-box">
      📏 Total: ${total.toFixed(2)} m<br>
      ✅ With 10% wastage: ${withWastage.toFixed(2)} m
    </div>
  </div>`;
  
  document.getElementById('results').innerHTML = html;
}

// Function to combine rooms
function combineRooms(roomId1, roomId2) {
  const r1 = rooms.find(r => r.id === roomId1);
  const r2 = rooms.find(r => r.id === roomId2);
  
  if (!r1 || !r2) return;
  
  const ppm = getPxPerMeter();
  
  // Store original room data for splitting later
  const originalR1 = JSON.parse(JSON.stringify(r1));
  const originalR2 = JSON.parse(JSON.stringify(r2));
  
  // Calculate bounding box
  const minX = Math.min(r1.x, r2.x);
  const minY = Math.min(r1.y, r2.y);
  const maxX = Math.max(r1.x + r1.width, r2.x + r2.width);
  const maxY = Math.max(r1.y + r1.height, r2.y + r2.height);
  
  // Create combined room
  const combinedRoom = {
    id: Date.now(),
    name: `${r1.name} + ${r2.name}`,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    orientation: 'length',
    color: r1.color,
    doors: [...r1.doors, ...r2.doors],
    isCombined: true,
    originalRoomData: [originalR1, originalR2]
  };
  
  // Remove old rooms
  rooms = rooms.filter(r => r.id !== roomId1 && r.id !== roomId2);
  
  // Add combined room
  rooms.push(combinedRoom);
  
  selectedRoom = combinedRoom;
  updateRoomsList();
  draw();
  
  // Recalculate to show new results
  calculate();
}
