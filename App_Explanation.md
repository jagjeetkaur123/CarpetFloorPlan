# Carpet Floor Plan Application Explanation

## Overview
The Carpet Floor Plan application is a professional web-based tool designed for creating interactive floor plans and calculating carpet requirements. It allows users to design room layouts, add doors, draw annotations, and compute precise carpet quantities with optimization for offcuts and wastage. The application is built as a Progressive Web App (PWA) with offline capabilities, making it suitable for use on desktop and mobile devices.

## Key Features

### 1. Interactive Floor Plan Designer
- **Room Drawing**: Users can draw rectangular rooms by clicking and dragging on a canvas grid.
- **Room Manipulation**: Rooms can be selected, moved, and resized dynamically.
- **Color Coding**: Each room is assigned a unique color for easy identification.
- **Grid System**: Adjustable pixel-to-meter ratio for accurate scaling.

### 2. Door Management
- **Door Placement**: Doors can be added to any edge of a room.
- **Door Types**: Supports single, double, and sliding door configurations.
- **Adjustable Width**: Door width can be customized (default 0.9 meters).

### 3. Freehand Drawing
- **Annotation Tools**: Users can draw custom notes and annotations on the floor plan.
- **Auto-Straightening**: Lines automatically straighten if drawn nearly horizontal or vertical.
- **Customizable Pen**: Adjustable pen size (1-10) and color.
- **Erasure**: Individual drawings can be erased selectively.

### 4. Smart Carpet Calculator
- **Precise Calculations**: Computes exact carpet requirements based on room dimensions and orientation.
- **Offcut Optimization**: Reuses carpet offcuts to minimize waste.
- **Wastage Calculation**: Includes configurable wastage per cut (default 10%).
- **Detailed Breakdown**: Provides per-room calculations and total summaries.
- **Cost Estimation**: Supports price per square meter and fitting cost inputs.

### 5. Save/Load System
- **Plan Storage**: Saves floor plans with unique IDs in browser localStorage.
- **Plan Sharing**: Plans can be shared via unique identifiers.
- **Restore Function**: Quick restore of a predefined floor plan (Hallway 1, Hallway 2, Lounge, Room 1).

### 6. Mobile Responsiveness
- **Touch Support**: Full touch controls for mobile devices.
- **Responsive Layout**: Optimized interface for phones and tablets.
- **PWA Features**: Installable as an app with offline functionality.

### 7. Background Image Support
- **Floor Plan Tracing**: Upload background images (including PDFs) to trace over existing plans.
- **Opacity Control**: Adjustable background image transparency.

## Technical Architecture

### File Structure
- **index.html**: Main HTML structure with sidebar, canvas, and panels.
- **css/styles.css**: Complete styling with mobile responsive design.
- **js/app.js**: Core application logic, state management, and UI controls.
- **js/canvas.js**: Canvas rendering, mouse/touch event handling, and drawing functions.
- **js/storage.js**: localStorage integration for save/load functionality.
- **js/carpet-calculator.js**: Carpet calculation algorithms and result generation.
- **manifest.json**: PWA manifest for app installation.
- **sw.js**: Service worker for offline capabilities.
- **icons/**: App icons for various sizes.

### Technologies Used
- **HTML5 Canvas**: For interactive drawing and rendering.
- **JavaScript (ES6+)**: Core application logic.
- **CSS3**: Responsive styling and animations.
- **Progressive Web App (PWA)**: Offline functionality and app-like experience.
- **localStorage API**: Client-side data persistence.

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

## How to Use the Application

### Basic Setup
1. Open the application in a modern web browser.
2. The interface consists of three main panels: left sidebar (tools), center canvas (drawing area), and right panel (rooms and calculations).

### Creating a Floor Plan
1. Select "Draw Room" mode from the sidebar.
2. Click and drag on the canvas to create rectangular rooms.
3. Use "Select/Move" mode to reposition or resize rooms.
4. Add doors using "Add Door" mode, clicking on room edges.
5. Use freehand drawing for annotations.

### Carpet Calculation
1. Set carpet settings (roll width, rounding, waste per cut) in the sidebar.
2. Configure room orientations in the right panel.
3. Click "Calculate Carpet" to generate detailed requirements.
4. Review results including total area, cuts, and cost estimates.

### Saving and Loading
1. Click "Save Plan" to generate a unique plan ID.
2. Use "Load Plan" to retrieve saved plans.
3. Share plan IDs with others for collaboration.

### Mobile Usage
- Use touch gestures for drawing and navigation.
- Two-finger gestures for panning on mobile devices.

## Development and Customization

### Setup Instructions
- Open the project folder in VS Code.
- Use Live Server extension to serve the application.
- Alternatively, run a simple HTTP server or open index.html directly.

### Customization Options
- **Colors**: Modify room colors in app.js.
- **Grid Scale**: Adjust default pixels per meter in index.html.
- **Carpet Formulas**: Edit calculation logic in carpet-calculator.js.
- **UI Styling**: Update styles.css for appearance changes.

## Conclusion
This Carpet Floor Plan application provides a comprehensive solution for floor planning and carpet estimation, combining intuitive design tools with precise calculation algorithms. Its PWA architecture ensures accessibility across devices, while the save/load system enables efficient workflow management. The application is suitable for carpet fitters, interior designers, and homeowners requiring accurate material planning.

To create a Word document, copy this explanation into Microsoft Word or a similar word processor, format as needed, and save as a .docx file. For the "186 nomination to department" context, this technical overview can serve as documentation for departmental review or nomination purposes.</content>
<parameter name="filePath">c:\Users\Toni\Desktop\Jag1910\CarpetFloorPlan\App_Explanation.md