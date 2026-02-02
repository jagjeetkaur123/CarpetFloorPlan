const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill container
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  draw();
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('load', () => {
  resizeCanvas();
  draw();
});

// World/Screen coordinate conversion
function screenToWorld(screenX, screenY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (screenX - rect.left - panX) / zoom,
    y: (screenY - rect.top - panY) / zoom
  };
}

function worldToScreen(worldX, worldY) {
  return {
    x: worldX * zoom + panX,
    y: worldY * zoom + panY
  };
}

// Touch events for mobile
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const mouseEvent = new MouseEvent('mouseup', {});
  canvas.dispatchEvent(mouseEvent);
});

// Mouse events
canvas.addEventListener('mousedown', (e) => {
  const world = screenToWorld(e.clientX, e.clientY);

  if (panMode) {
    canvas.style.cursor = 'grabbing';
    lastPanX = e.clientX;
    lastPanY = e.clientY;
    dragging = true;
    return;
  }

  if (mode === 'draw') {
    drawing = true;
    startX = world.x;
    startY = world.y;
  } else if (mode === 'select') {
    for (let i = rooms.length - 1; i >= 0; i--) {
      const room = rooms[i];
      if (world.x >= room.x && world.x <= room.x + room.width &&
          world.y >= room.y && world.y <= room.y + room.height) {
        dragging = true;
        dragRoom = room;
        selectedRoom = room;
        dragOffsetX = world.x - room.x;
        dragOffsetY = world.y - room.y;
        canvas.style.cursor = 'grabbing';
        updateRoomsList();
        draw();
        return;
      }
    }
    selectedRoom = null;
    updateRoomsList();
    draw();
  } else if (mode === 'door') {
    addDoorAtPosition(world.x, world.y);
  } else if (mode === 'freehand') {
    drawing = true;
    currentPath = {
      points: [{x: world.x, y: world.y}],
      color: document.getElementById('penColor').value,
      size: parseInt(document.getElementById('penSize').value)
    };
  } else if (mode === 'erase') {
    eraseFreehandAt(world.x, world.y);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const world = screenToWorld(e.clientX, e.clientY);

  if (panMode && dragging) {
    panX += e.clientX - lastPanX;
    panY += e.clientY - lastPanY;
    lastPanX = e.clientX;
    lastPanY = e.clientY;
    draw();
    return;
  }

  if (drawing && mode === 'draw') {
    draw();
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(startX, startY, world.x - startX, world.y - startY);
    ctx.restore();
  } else if (dragging && dragRoom) {
    dragRoom.x = world.x - dragOffsetX;
    dragRoom.y = world.y - dragOffsetY;
    draw();
  } else if (drawing && mode === 'freehand' && currentPath) {
    currentPath.points.push({x: world.x, y: world.y});
    draw();
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (panMode && dragging) {
    canvas.style.cursor = 'default';
    dragging = false;
    return;
  }

  if (drawing && mode === 'draw') {
    const world = screenToWorld(e.clientX, e.clientY);
    
    const width = Math.abs(world.x - startX);
    const height = Math.abs(world.y - startY);
    
    if (width > 20 && height > 20) {
      const room = {
        id: Date.now(),
        name: `Room ${roomCounter++}`,
        x: Math.min(startX, world.x),
        y: Math.min(startY, world.y),
        width: width,
        height: height,
        orientation: 'length',
        color: getRandomColor(),
        doors: []
      };
      rooms.push(room);
      selectedRoom = room;
      updateRoomsList();
      draw();
    }
    
    drawing = false;
  } else if (dragging && dragRoom) {
    canvas.style.cursor = 'move';
    dragging = false;
    dragRoom = null;
  } else if (drawing && mode === 'freehand' && currentPath) {
    // Apply line straightening
    currentPath.points = straightenPath(currentPath.points);
    freehandPaths.push(currentPath);
    currentPath = null;
    drawing = false;
    draw();
  }
});

// Main draw function
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  // Draw grid
  const ppm = getPxPerMeter();
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 1 / zoom;
  
  const startGridX = -panX / zoom;
  const startGridY = -panY / zoom;
  const endX = (canvas.width - panX) / zoom;
  const endY = (canvas.height - panY) / zoom;
  
  for (let x = Math.floor(startGridX / ppm) * ppm; x < endX; x += ppm) {
    ctx.beginPath();
    ctx.moveTo(x, startGridY);
    ctx.lineTo(x, endY);
    ctx.stroke();
  }
  
  for (let y = Math.floor(startGridY / ppm) * ppm; y < endY; y += ppm) {
    ctx.beginPath();
    ctx.moveTo(startGridX, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  // Draw freehand paths
  freehandPaths.forEach(path => {
    if (path.points.length < 2) return;
    
    ctx.strokeStyle = path.color;
    ctx.lineWidth = path.size / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    for (let i = 1; i < path.points.length; i++) {
      ctx.lineTo(path.points[i].x, path.points[i].y);
    }
    ctx.stroke();
  });

  // Draw current freehand path
  if (currentPath && currentPath.points.length > 1) {
    ctx.strokeStyle = currentPath.color;
    ctx.lineWidth = currentPath.size / zoom;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
    for (let i = 1; i < currentPath.points.length; i++) {
      ctx.lineTo(currentPath.points[i].x, currentPath.points[i].y);
    }
    ctx.stroke();
  }

  // Draw rooms
  rooms.forEach(room => {
    ctx.fillStyle = room.color + (room === selectedRoom ? 'BB' : '66');
    ctx.fillRect(room.x, room.y, room.width, room.height);
    
    // Draw special border for combined rooms
    if (room.isCombined) {
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 4 / zoom;
      ctx.setLineDash([10 / zoom, 5 / zoom]);
      ctx.strokeRect(room.x, room.y, room.width, room.height);
      ctx.setLineDash([]);
    }
    
    ctx.strokeStyle = room === selectedRoom ? '#2ecc71' : '#34495e';
    ctx.lineWidth = (room === selectedRoom ? 3 : 1.5) / zoom;
    ctx.strokeRect(room.x, room.y, room.width, room.height);
    
    // Draw doors
    room.doors.forEach(door => {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2 / zoom;
      
      if (door.side === 'top' || door.side === 'bottom') {
        ctx.fillRect(door.x, door.y - 3/zoom, door.width, 6/zoom);
        ctx.strokeRect(door.x, door.y - 3/zoom, door.width, 6/zoom);
        
        if (door.type === 'single') {
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 1 / zoom;
          ctx.beginPath();
          ctx.arc(door.x, door.y, door.width, 
                 door.side === 'top' ? Math.PI : 0, 
                 door.side === 'top' ? 0 : Math.PI);
          ctx.stroke();
        }
      } else {
        ctx.fillRect(door.x - 3/zoom, door.y, 6/zoom, door.width);
        ctx.strokeRect(door.x - 3/zoom, door.y, 6/zoom, door.width);
        
        if (door.type === 'single') {
          ctx.strokeStyle = '#8B4513';
          ctx.lineWidth = 1 / zoom;
          ctx.beginPath();
          ctx.arc(door.x, door.y, door.width, 
                 door.side === 'left' ? -Math.PI/2 : Math.PI/2, 
                 door.side === 'left' ? Math.PI/2 : -Math.PI/2);
          ctx.stroke();
        }
      }
    });
    
    // Labels
    ctx.fillStyle = '#2c3e50';
    ctx.font = `${14 / zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const lengthM = (room.width / ppm).toFixed(2);
    const widthM = (room.height / ppm).toFixed(2);
    
    ctx.fillText(room.name, room.x + room.width/2, room.y + room.height/2 - 10/zoom);
    ctx.font = `${11 / zoom}px Arial`;
    ctx.fillText(`${lengthM}m × ${widthM}m`, room.x + room.width/2, room.y + room.height/2 + 8/zoom);
  });

  ctx.restore();
}
