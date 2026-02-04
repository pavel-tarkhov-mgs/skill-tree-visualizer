# Skill Tree Visualizer & Editor

A browser-based tool to visualize, edit, and generate skill tree data (JSON & GraphQL).

## Features

- **Visualize**: Render skill trees from JSON on an interactive HTML5 Canvas.
- **Edit**: Drag & drop skills, modify properties, and manage connections (Lines & Arcs) in the sidebar.
- **Generate**: Export your changes as clean JSON or GraphQL mutations.
- **Interactive**: Pan, zoom, and select skills to edit.

## How to Use

1. Open `index.html` in your browser.
2. Paste skill tree JSON into the top panel (see `sample-data.json` for format).
3. Click **Generate Skill Tree**.
4. **Edit**:
    - Click a skill to select it.
    - Drag to move.
    - Use the right sidebar to change properties or add/edit connections.
5. **Export**:
    - Click **Generate JSON** to get the updated JSON structure.
    - Click **Generate Query** to get a GraphQL mutation for updating the tree.

## Controls

- **Pan**: Drag empty space / Touch drag
- **Zoom**: Mouse wheel / Pinch / `+` `-` keys
- **Reset**: `R` key or Reset button

## File Structure

- `index.html`: Main application
- `script.js`: Logic (Rendering, Editing, Generation)
- `styles.css`: Styling
- `sample-data.json`: Example data format
