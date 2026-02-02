# Floor Plan & Carpet Calculator

A professional web-based application for creating floor plans and calculating carpet requirements with advanced features like door placement, freehand drawing, and save/load functionality.

## Features

- 🏠 **Interactive Floor Plan Designer**
  - Draw rectangular rooms with click and drag
  - Move and resize rooms dynamically
  - Color-coded room identification
  
- 🚪 **Door Management**
  - Add doors to any room edge
  - Multiple door types (Single, Double, Sliding)
  - Adjustable door width
  
- ✏️ **Freehand Drawing**
  - Draw custom annotations and notes
  - Auto-straightening for horizontal/vertical lines
  - Adjustable pen size and color
  - Erase individual drawings
  
- 🧮 **Smart Carpet Calculator**
  - Calculates exact carpet requirements
  - Offcut reuse optimization
  - Wastage calculation (10% default)
  - Detailed breakdown per room
  
- 💾 **Save/Load System**
  - Save plans with unique IDs
  - Load previously saved plans
  - Stores all data in browser localStorage
  - Share plan IDs with others
  
- 📱 **Mobile Responsive**
  - Full touch support
  - Optimized layout for mobile devices
  - Works on phones and tablets

## Project Structure

```
floor-plan-calculator/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── app.js              # Main application logic
│   ├── canvas.js           # Canvas rendering and interactions
│   ├── storage.js          # Save/load functionality
│   └── carpet-calculator.js # Carpet calculation logic
└── README.md               # This file
```

## Setup Instructions

### Option 1: Direct Open (Recommended)

1. Open VS Code
2. File → Open Folder → Select `floor-plan-calculator` folder
3. Right-click on `index.html` → Open with Live Server
   - If you don't have Live Server extension:
     - Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
     - Search for "Live Server"
     - Install by Ritwick Dey
     - Right-click `index.html` → Open with Live Server

### Option 2: Simple HTTP Server

```bash
# Navigate to project folder
cd floor-plan-calculator

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then open browser: `http://localhost:8000`

### Option 3: Direct Browser Open

Simply double-click `index.html` - it will open in your default browser. All features work without a server!

## Usage Guide

### Drawing Rooms

1. Click **"Draw Room"** button (left sidebar)
2. Click and drag on canvas to draw rectangular rooms
3. Release to create the room

### Moving Rooms

1. Click **"Select/Move"** button
2. Click and drag any room to reposition it

### Adding Doors

1. Click **"Add Door"** button
2. Click on any room edge where you want the door
3. Adjust door settings in the sidebar if needed

### Freehand Drawing

1. Click **"Freehand Draw"** button
2. Click and drag to draw
3. Lines automatically straighten if nearly horizontal/vertical
4. Use **"Erase Freehand"** to remove drawings

### Calculating Carpet

1. Add all your rooms
2. Set carpet orientation for each room (right panel)
3. Adjust carpet settings (roll width, rounding)
4. Click **"Calculate Carpet"** button
5. View detailed breakdown in results panel

### Saving & Loading

**To Save:**
1. Click **"Save Plan"** button
2. Note the unique Plan ID (e.g., `FP-L2K3M9X-ABC12`)
3. Share this ID or save it for later

**To Load:**
1. Click **"Load Plan"** button
2. Select a plan from the list
3. Or share the Plan ID with others

## Keyboard Shortcuts & Tips

- **Zoom**: Use zoom buttons in toolbar or mouse wheel
- **Pan**: Toggle pan mode and drag canvas
- **Mobile**: Use two fingers to pan on mobile devices
- **Grid**: Adjust "Pixels per Meter" to change scale

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Development

### File Descriptions

**index.html**
- Main HTML structure
- Sidebar, canvas, and room list panels
- Modal for loading plans

**css/styles.css**
- Complete styling for all components
- Mobile responsive breakpoints
- Color scheme and layout

**js/app.js**
- Core application state management
- Room and door management functions
- Mode switching and UI updates

**js/canvas.js**
- Canvas rendering logic
- Mouse and touch event handling
- Drawing functions for rooms, doors, freehand

**js/storage.js**
- localStorage integration
- Save/load plan functionality
- Plan ID generation

**js/carpet-calculator.js**
- Carpet calculation algorithm
- Offcut reuse optimization
- Result generation and display

### Customization

**Change Colors:**
Edit `js/app.js` → `getRandomColor()` function

**Adjust Grid:**
Modify default in `index.html` → `pxPerMeter` input value

**Carpet Formula:**
Edit `js/carpet-calculator.js` → `calcRoom()` function

## Troubleshooting

**Canvas not showing:**
- Check browser console for errors (F12)
- Ensure all JS files are loaded properly

**Mobile not working:**
- Clear browser cache
- Try in Chrome/Safari mobile
- Check touch events are not blocked

**Save not working:**
- Check if localStorage is enabled in browser
- Clear old data: Run in console: `localStorage.clear()`

**Plans not loading:**
- Verify localStorage has data: `localStorage.getItem('floorPlans')`
- Check browser console for errors

## Future Enhancements

Possible features to add:
- [ ] Export to PDF/PNG
- [ ] Import/Export JSON
- [ ] Multiple floor support
- [ ] Furniture placement
- [ ] Wall thickness
- [ ] Measurement tools
- [ ] Cost calculator
- [ ] Print layout
- [ ] Undo/Redo functionality
- [ ] Snap to measurements

## Credits

Developed as a professional floor planning and carpet calculation tool.

## License

Free to use and modify for personal and commercial projects.

## Support

For issues or questions, check the code comments in each file for detailed explanations of functionality.

---

**Pro Tip:** Use the unique Plan ID system to share floor plans with clients or team members. They can load your exact design using just the ID!
