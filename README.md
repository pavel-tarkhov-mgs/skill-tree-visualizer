# Skill Tree Visualizer

A browser-based skill tree visualization tool that renders skill trees from JSON data on an HTML5 Canvas.

## Features

- **JSON Input**: Paste skill tree data in JSON format
- **Visual Rendering**: Skills displayed as colored circles based on type
- **Connection Drawing**: Supports both line and arc connections between skills
- **Interactive Canvas**: 
  - Pan (drag with mouse)
  - Zoom (mouse wheel or +/- keys)
  - Touch support for mobile devices
  - Reset view button
- **Error Handling**: Comprehensive validation with user-friendly error messages
- **Dark Theme**: Modern dark interface for comfortable viewing

## How to Use

1. Open `index.html` in your web browser
2. Paste your skill tree JSON data into the left panel textarea
3. Click "Generate Skill Tree" button
4. View the rendered skill tree on the canvas

Alternatively, press `Ctrl+Enter` while in the textarea to generate the tree.

## Navigation Controls

Once your skill tree is rendered, you can navigate it using:

### Mouse Controls
- **Pan (Move)**: Click and drag on the canvas
- **Zoom In/Out**: Scroll mouse wheel up/down
- **Reset View**: Click the "Reset View" button

### Keyboard Shortcuts
- `+` or `=` - Zoom in
- `-` - Zoom out
- `R` - Reset view to default position and zoom

### Touch Controls (Mobile/Tablet)
- **Pan**: Single finger drag
- **Zoom**: Pinch with two fingers

## JSON Format

The application expects a JSON object with a `skills` array (or just an array of skills) with the following structure:

**Note:** The application automatically handles both regular JSON and escaped JSON strings (with `\"` instead of `"`), so you can paste either format.

```json
{
  "skills": [
    {
      "id": "skill1",
      "name": "Skill Name",
      "type": "active",
      "description": "Optional description",
      "price": 100,
      "gameplayEffects": ["effect1", "effect2"],
      "abilities": ["ability1"],
      "point": {
        "x": 100.0,
        "y": 200.0
      },
      "connections": [
        {
          "type": "line",
          "id": "conn1",
          "targetSkillId": "skill2",
          "wayPoints": [
            { "x": 150.0, "y": 250.0 }
          ]
        },
        {
          "type": "ark",
          "id": "conn2",
          "targetSkillId": "skill3",
          "circleCenter": { "x": 300.0, "y": 400.0 }
        }
      ]
    }
  ]
}
```

### Required Fields

- `id`: Unique identifier for the skill
- `name`: Display name of the skill
- `type`: Skill type (e.g., "active", "passive", "ultimate", "basic")
- `point`: Object with `x` and `y` coordinates for skill position (note: point (0,0) is at canvas center)
- `gameplayEffects`: Array of gameplay effect strings
- `abilities`: Array of ability strings

**Note on Coordinates**: The coordinate system is centered, meaning point (0, 0) is at the center of the 1200x800px canvas. Positive X values go right, negative X go left. Positive Y values go down, negative Y go up.

### Optional Fields

- `description`: Text description of the skill
- `price`: Cost to unlock the skill
- `connections`: Array of connection objects linking to other skills

### Connection Types

**Line Connection:**
```json
{
  "type": "line",
  "id": "conn1",
  "targetSkillId": "target_skill_id",
  "wayPoints": [
    { "x": 150.0, "y": 250.0 }
  ]
}
```
- Draws straight lines or polylines through waypoints
- `wayPoints` is optional; if omitted, draws direct line

**Arc Connection:**
```json
{
  "type": "ark",
  "id": "conn2",
  "targetSkillId": "target_skill_id",
  "circleCenter": { "x": 300.0, "y": 400.0 }
}
```
- Draws curved arc between skills
- `circleCenter` defines the center point of the arc

## Skill Types and Colors

Different skill types are rendered with different colors:

- **active**: Green (#4CAF50)
- **passive**: Blue (#2196F3)
- **ultimate**: Purple (#9C27B0)
- **basic**: Orange (#FF9800)
- **default**: Gray (#757575)

## Sample Data

A sample skill tree JSON file is provided in `sample-data.json`. You can use this to test the visualizer:

1. Open `sample-data.json`
2. Copy all contents
3. Paste into the JSON input textarea
4. Click "Generate Skill Tree"

## Technical Details

- **Canvas Size**: 1200x800 pixels
- **Coordinate System**: Point (0, 0) is at the center of the canvas
- **Interactive Navigation**: Pan, zoom, and reset view
- **Zoom Range**: 10% to 500%
- **Skill Radius**: 35 pixels
- **Connection Width**: 3 pixels
- **Framework**: Vanilla JavaScript (no dependencies)
- **Rendering**: HTML5 Canvas 2D Context with transformations

## File Structure

```
DrawSkills/
├── index.html          # Main HTML structure
├── styles.css          # Styling and layout
├── script.js           # Core rendering logic
├── sample-data.json    # Example skill tree data
└── README.md           # This file
```

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript (classes, arrow functions, etc.)
- CSS3 (flexbox, gradients)

Tested on:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Error Messages

The application provides helpful error messages for common issues:

- Empty JSON input
- Invalid JSON syntax
- Missing required fields
- Invalid coordinate values
- References to non-existent skills

## Future Enhancements

Potential features for future versions:

- ✅ ~~Zoom and pan controls~~ (Implemented!)
- Auto-scaling to fit all skills in viewport
- Interactive tooltips on hover
- Click to show skill details
- Grid background for reference
- Export as image (PNG/SVG)
- Skill type legend
- Sample data button
- Drag and drop JSON file upload
- Mini-map for large skill trees
- Highlight skill paths/dependencies

## License

Free to use and modify for personal and commercial projects.
