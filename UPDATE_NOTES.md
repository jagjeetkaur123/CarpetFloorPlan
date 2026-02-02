# Floor Plan Calculator - v2 Update Notes

## 🎉 NEW FEATURE: Smart Room Combination

### What's New?

The calculator now **automatically detects** when rooms are adjacent (sharing walls) and suggests combining them to **save carpet**!

### How It Works:

1. **Draw your rooms** as normal (e.g., Room 1, Room 2, Hallway)
2. Click **"Calculate Carpet"**
3. If rooms are adjacent, you'll see a **purple optimization banner** at the top of results:

```
💡 Smart Optimization Detected!
Some rooms are adjacent. Combining them can save carpet:

Room 1 + Room 2
Separate: 20.70m | Combined: 15.40m | 💰 Save 5.30m!
[✨ Combine These Rooms]
```

4. Click **"✨ Combine These Rooms"** button
5. The rooms merge on the canvas with a **purple dashed border**
6. **Instant savings calculation** shows your reduced carpet requirement!

### Visual Indicators:

- **Purple dashed border** = Combined room
- **✨ Combined Room badge** in room list
- **Split Back button** to undo combination

### Benefits:

✅ **Automatic detection** - no manual calculation needed
✅ **Shows exact savings** - know how much you'll save
✅ **Visual feedback** - see combined rooms on canvas
✅ **Reversible** - split rooms back anytime
✅ **Real-world optimization** - matches professional carpet installation practices

### Example Scenario:

**Your Scenario (Room + Hallway):**

Before:
- Room 1: 13.90m carpet
- Room 2: 6.80m carpet
- Hallway: 13.80m carpet
- **Total: 34.50m**

After Combining:
- Room 1 + Hallway: Combined calculation
- Room 2 + Hallway: Combined calculation
- **Total: ~25-28m** (saves 6-9m!)

### Technical Details:

The algorithm:
1. Detects rooms that share edges (within 5px tolerance)
2. Calculates both separate and combined carpet requirements
3. Only suggests combination if savings > 0.1m
4. Uses bounding box calculation for combined areas
5. Preserves all doors and properties

### Files Modified:

- `js/carpet-calculator.js` - Added detection and combination logic
- `js/app.js` - Added split room functionality
- `js/canvas.js` - Added visual indicator for combined rooms
- `css/styles.css` - Added styling for optimization banner

### How to Use:

1. Replace your old files with the new ones
2. Open `index.html` in browser
3. Draw adjacent rooms
4. Calculate carpet
5. Look for optimization suggestions!

---

## Installation:

Simply extract the new ZIP file and replace your old project folder.

All existing features remain the same:
- ✅ Room drawing and editing
- ✅ Door placement
- ✅ Freehand annotations
- ✅ Save/Load plans
- ✅ Mobile responsive
- ✅ Original carpet calculation logic

**Plus the new smart optimization feature!**

---

## Questions?

Check the updated README.md for full documentation.

Enjoy saving money on carpet! 💰🎉
