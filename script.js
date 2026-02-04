// Skill Tree Visualizer - Main JavaScript

class SkillTreeRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.skills = [];
        this.skillMap = new Map();
        
        // Rendering settings
        this.skillRadius = 35;
        this.connectionWidth = 3;
        
        // Pan and Zoom settings
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 5;
        
        // Mouse interaction state
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Skill dragging state
        this.isDraggingSkill = false;
        this.draggedSkill = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Hover state
        this.hoveredSkill = null;
        
        // Selection state
        this.selectedSkill = null;
        this.onSkillSelect = null; // Callback for selection
        this.onSkillMove = null;   // Callback for movement
        
        // Color scheme for different skill types
        this.typeColors = {
            'active': '#4CAF50',
            'passive': '#2196F3',
            'ultimate': '#9C27B0',
            'basic': '#FF9800',
            'default': '#757575'
        };
        
        // Setup interaction handlers
        this.setupInteraction();
    }
    
    setupInteraction() {
        // Mouse wheel for zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Zoom factor
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = this.scale * zoomFactor;
            
            // Limit scale
            if (newScale >= this.minScale && newScale <= this.maxScale) {
                // Calculate mouse position in world coordinates before zoom
                const worldX = (mouseX - this.canvas.width / 2 - this.offsetX) / this.scale;
                const worldY = (mouseY - this.canvas.height / 2 - this.offsetY) / this.scale;
                
                // Apply new scale
                this.scale = newScale;
                
                // Calculate mouse position in world coordinates after zoom
                // and adjust offset to keep the point under mouse cursor
                this.offsetX = mouseX - this.canvas.width / 2 - worldX * this.scale;
                this.offsetY = mouseY - this.canvas.height / 2 - worldY * this.scale;
                
                this.redraw();
            }
        }, { passive: false });
        
        // Mouse down - start dragging
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Check if clicking on a skill
            const clickedSkill = this.getSkillAtPosition(mouseX, mouseY);
            
            if (clickedSkill) {
                // Select skill
                this.selectedSkill = clickedSkill;
                if (this.onSkillSelect) {
                    this.onSkillSelect(clickedSkill);
                }
                
                this.isDraggingSkill = true;
                this.draggedSkill = clickedSkill;
                const worldPos = this.screenToWorld(mouseX, mouseY);
                this.dragOffsetX = worldPos.x - clickedSkill.point.x;
                this.dragOffsetY = worldPos.y - clickedSkill.point.y;
                this.canvas.style.cursor = 'grabbing';
                this.redraw(); // Redraw to show selection highlight
            } else {
                // Deselect if clicking empty space
                if (this.selectedSkill) {
                    this.selectedSkill = null;
                    if (this.onSkillSelect) {
                        this.onSkillSelect(null);
                    }
                    this.redraw();
                }
                
                // Start canvas panning
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.canvas.style.cursor = 'grabbing';
            }
        });
        
        // Mouse move - pan or drag skill
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            if (this.isDraggingSkill && this.draggedSkill) {
                // Update skill position
                const worldPos = this.screenToWorld(mouseX, mouseY);
                this.draggedSkill.point.x = worldPos.x - this.dragOffsetX;
                this.draggedSkill.point.y = worldPos.y - this.dragOffsetY;
                
                // Notify movement
                if (this.onSkillMove) {
                    this.onSkillMove(this.draggedSkill);
                }
                
                this.redraw();
            } else if (this.isDragging) {
                // Pan canvas
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;

                this.offsetX += dx;
                this.offsetY += dy;

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;

                this.redraw();
            } else {
                // Update cursor and hover state based on what's under mouse
                const skillUnderMouse = this.getSkillAtPosition(mouseX, mouseY);
                this.canvas.style.cursor = skillUnderMouse ? 'grab' : 'grab';

                // Update hover state
                if (this.hoveredSkill !== skillUnderMouse) {
                    this.hoveredSkill = skillUnderMouse;
                    this.redraw();
                }
            }
        });
        
        // Mouse up - stop dragging
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isDraggingSkill = false;
            this.draggedSkill = null;
            this.canvas.style.cursor = 'grab';
            // Keep hover state for potential click handling
        });
        
        // Mouse leave - stop dragging
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isDraggingSkill = false;
            this.draggedSkill = null;
            this.hoveredSkill = null;
            this.canvas.style.cursor = 'grab';
            this.redraw();
        });
        
        // Set initial cursor
        this.canvas.style.cursor = 'grab';
        
        // Touch support for mobile
        let lastTouchDistance = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                // Single touch - pan
                e.preventDefault();
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Two touches - zoom
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isDragging) {
                // Pan
                e.preventDefault();
                const dx = e.touches[0].clientX - this.lastMouseX;
                const dy = e.touches[0].clientY - this.lastMouseY;
                
                this.offsetX += dx;
                this.offsetY += dy;
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
                
                this.redraw();
            } else if (e.touches.length === 2) {
                // Zoom
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (lastTouchDistance > 0) {
                    const zoomFactor = distance / lastTouchDistance;
                    const newScale = this.scale * zoomFactor;
                    
                    if (newScale >= this.minScale && newScale <= this.maxScale) {
                        this.scale = newScale;
                        this.redraw();
                    }
                }
                
                lastTouchDistance = distance;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
            lastTouchDistance = 0;
        });
    }
    
    resetView() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.redraw();
    }

    // Convert screen coordinates to world coordinates
    screenToWorld(screenX, screenY) {
        const worldX = (screenX - this.canvas.width / 2 - this.offsetX) / this.scale;
        const worldY = (screenY - this.canvas.height / 2 - this.offsetY) / this.scale;
        return { x: worldX, y: worldY };
    }

    // Get skill under cursor
    getSkillAtPosition(screenX, screenY) {
        const worldPos = this.screenToWorld(screenX, screenY);

        for (const skill of this.skills) {
            const dx = worldPos.x - skill.point.x;
            const dy = worldPos.y - skill.point.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.skillRadius) {
                return skill;
            }
        }

        return null;
    }
    
    redraw() {
        if (this.skills.length > 0) {
            this.render(this.skills);
        }
    }
    
    render(skills) {
        this.skills = skills;
        this.buildSkillMap();
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context state
        this.ctx.save();
        
        // Translate coordinate system so (0,0) is at canvas center
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        
        // Apply pan offset
        this.ctx.translate(this.offsetX, this.offsetY);
        
        // Apply zoom scale
        this.ctx.scale(this.scale, this.scale);
        
        // Draw all connections first (background layer)
        this.drawAllConnections();
        
        // Draw all skills on top (foreground layer)
        this.drawAllSkills();
        
        // Restore context state
        this.ctx.restore();
        
        // Draw zoom level indicator
        this.drawZoomIndicator();
    }
    
    drawZoomIndicator() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Zoom: ${(this.scale * 100).toFixed(0)}%`, this.canvas.width - 10, 20);
        this.ctx.restore();
    }
    
    buildSkillMap() {
        this.skillMap.clear();
        for (const skill of this.skills) {
            this.skillMap.set(skill.id, skill);
        }
    }
    
    drawAllConnections() {
        for (const skill of this.skills) {
            if (skill.connections && Array.isArray(skill.connections)) {
                for (const connection of skill.connections) {
                    this.drawConnection(skill, connection);
                }
            }
        }
    }
    
    drawConnection(sourceSkill, connection) {
        const targetSkill = this.skillMap.get(connection.targetSkillId);
        
        if (!targetSkill) {
            console.warn(`Target skill not found: ${connection.targetSkillId}`);
            return;
        }
        
        this.ctx.save();
        this.ctx.strokeStyle = '#888888';
        this.ctx.lineWidth = this.connectionWidth;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (connection.type === 'line') {
            this.drawLineConnection(sourceSkill, targetSkill, connection);
        } else if (connection.type === 'ark') {
            this.drawArcConnection(sourceSkill, targetSkill, connection);
        }
        
        this.ctx.restore();
    }
    
    drawLineConnection(sourceSkill, targetSkill, connection) {
        const startX = sourceSkill.point.x;
        const startY = sourceSkill.point.y;
        const endX = targetSkill.point.x;
        const endY = targetSkill.point.y;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        
        // If waypoints exist, draw through them
        if (connection.wayPoints && Array.isArray(connection.wayPoints) && connection.wayPoints.length > 0) {
            for (const waypoint of connection.wayPoints) {
                this.ctx.lineTo(waypoint.x, waypoint.y);
            }
        }
        
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }
    
    drawArcConnection(sourceSkill, targetSkill, connection) {
        if (!connection.circleCenter) {
            // Fallback to straight line if no circle center
            this.drawLineConnection(sourceSkill, targetSkill, connection);
            return;
        }
        
        const centerX = connection.circleCenter.x;
        const centerY = connection.circleCenter.y;
        const startX = sourceSkill.point.x;
        const startY = sourceSkill.point.y;
        const endX = targetSkill.point.x;
        const endY = targetSkill.point.y;
        
        // Calculate radius from center to start point
        const radius = Math.sqrt(
            Math.pow(startX - centerX, 2) + 
            Math.pow(startY - centerY, 2)
        );
        
        // Calculate angles
        const startAngle = Math.atan2(startY - centerY, startX - centerX);
        const endAngle = Math.atan2(endY - centerY, endX - centerX);
        
        // Determine if we should draw clockwise or counterclockwise
        // We'll choose the shorter arc
        let angleDiff = endAngle - startAngle;
        
        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const counterClockwise = angleDiff < 0;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, startAngle, endAngle, counterClockwise);
        this.ctx.stroke();
    }
    
    drawAllSkills() {
        for (const skill of this.skills) {
            this.drawSkill(skill);
        }
    }
    
    drawSkill(skill) {
        const x = skill.point.x;
        const y = skill.point.y;

        // Get color based on skill type
        const skillType = skill.type ? skill.type.toLowerCase() : 'default';
        const fillColor = this.typeColors[skillType] || this.typeColors['default'];

        this.ctx.save();

        // Draw circle
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.skillRadius, 0, Math.PI * 2);
        this.ctx.fillStyle = fillColor;
        this.ctx.fill();

        // Draw border - thicker for hovered/dragged/selected skills
        const isHovered = this.hoveredSkill === skill;
        const isDragged = this.draggedSkill === skill;
        const isSelected = this.selectedSkill === skill;
        
        let borderWidth = 3;
        let borderColor = '#ffffff';
        
        if (isSelected) {
            borderWidth = 5;
            borderColor = '#4CAF50'; // Green for selected
        } else if (isDragged) {
            borderWidth = 5;
            borderColor = '#FFD700'; // Gold for dragged
        } else if (isHovered) {
            borderWidth = 4;
        }

        this.ctx.strokeStyle = borderColor;
        this.ctx.lineWidth = borderWidth;
        this.ctx.stroke();
        
        // Draw skill name
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Wrap text if too long
        const maxWidth = this.skillRadius * 1.8;
        const words = skill.name.split(' ');
        let lines = [];
        let currentLine = words[0];
        
        for (let i = 1; i < words.length; i++) {
            const testLine = currentLine + ' ' + words[i];
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = words[i];
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        
        // Draw text lines
        const lineHeight = 14;
        const totalHeight = lines.length * lineHeight;
        const startY = y - totalHeight / 2 + lineHeight / 2;
        
        // If too many lines, just show first line with ellipsis
        if (lines.length > 2) {
            lines = [lines[0]];
            if (lines[0].length > 8) {
                lines[0] = lines[0].substring(0, 8) + '...';
            } else {
                lines[0] = lines[0] + '...';
            }
        }
        
        for (let i = 0; i < lines.length; i++) {
            this.ctx.fillText(lines[i], x, startY + i * lineHeight);
        }
        
        // Draw price if exists
        if (skill.price !== undefined && skill.price !== null) {
            this.ctx.font = '10px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`${skill.price}`, x, y + this.skillRadius + 15);
        }
        
        this.ctx.restore();
    }
}

// JSON Parser and Validator
function parseSkillTree(jsonString) {
    // Check for empty input
    if (!jsonString || jsonString.trim() === '') {
        throw new Error('JSON input is empty. Please paste skill tree data.');
    }
    
    // Check if the string contains escaped quotes (like {\"skills\":...)
    // This happens when JSON is escaped as a string literal
    let cleanedString = jsonString.trim();
    if (cleanedString.startsWith('{\\') || cleanedString.includes('\\"')) {
        try {
            // Try to unescape the string
            cleanedString = cleanedString.replace(/\\"/g, '"');
        } catch (e) {
            // If unescaping fails, continue with original string
        }
    }
    
    let data;
    try {
        data = JSON.parse(cleanedString);
    } catch (e) {
        throw new Error(`Invalid JSON syntax: ${e.message}`);
    }
    
    // Check if data has a "skills" property (wrapped format)
    let skills;
    if (data.skills && Array.isArray(data.skills)) {
        skills = data.skills;
    } else if (Array.isArray(data)) {
        skills = data;
    } else {
        throw new Error('JSON must contain a "skills" array or be an array of skills');
    }
    
    if (skills.length === 0) {
        throw new Error('Skill array is empty');
    }
    
    // Validate each skill
    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        
        // Check required fields (camelCase format)
        if (!skill.id) {
            throw new Error(`Skill at index ${i} is missing required field: id`);
        }
        if (!skill.name) {
            throw new Error(`Skill "${skill.id}" is missing required field: name`);
        }
        if (!skill.type) {
            throw new Error(`Skill "${skill.id}" is missing required field: type`);
        }
        if (!skill.point) {
            throw new Error(`Skill "${skill.id}" is missing required field: point`);
        }
        
        // Validate Point structure (lowercase x, y)
        if (typeof skill.point.x !== 'number' || typeof skill.point.y !== 'number') {
            throw new Error(`Skill "${skill.id}" has invalid point coordinates`);
        }
        
        // Validate connections if they exist
        if (skill.connections && Array.isArray(skill.connections)) {
            for (const connection of skill.connections) {
                if (!connection.targetSkillId) {
                    throw new Error(`Skill "${skill.id}" has a connection missing targetSkillId`);
                }
            }
        }
    }
    
    return skills;
}

// Error display function
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (message) {
        errorDiv.textContent = message;
        errorDiv.classList.add('active');
    } else {
        errorDiv.textContent = '';
        errorDiv.classList.remove('active');
    }
}

// Initialize the application
let renderer;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('skillTreeCanvas');
    renderer = new SkillTreeRenderer(canvas);
    
    const generateBtn = document.getElementById('generateBtn');
    const jsonInput = document.getElementById('jsonInput');
    const resetViewBtn = document.getElementById('resetViewBtn');
    
    // Editor elements
    const skillEditor = document.getElementById('skillEditor');
    const editorPlaceholder = document.getElementById('editorPlaceholder');
    const closeEditorBtn = document.getElementById('closeEditorBtn');
    const editId = document.getElementById('editId');
    const editName = document.getElementById('editName');
    const editType = document.getElementById('editType');
    const editX = document.getElementById('editX');
    const editY = document.getElementById('editY');
    const editPrice = document.getElementById('editPrice');
    const editDescription = document.getElementById('editDescription');
    const connectionsList = document.getElementById('connectionsList');
    const addConnectionBtn = document.getElementById('addConnectionBtn');

    // Close editor button
    closeEditorBtn.addEventListener('click', () => {
        skillEditor.style.display = 'none';
        editorPlaceholder.style.display = 'flex';
        renderer.selectedSkill = null;
        renderer.redraw();
    });

    // Handle selection
    renderer.onSkillSelect = (skill) => {
        if (skill) {
            // Populate form
            editId.value = skill.id || '';
            editName.value = skill.name || '';
            editType.value = skill.type ? skill.type.toLowerCase() : 'active';
            editX.value = Math.round(skill.point.x);
            editY.value = Math.round(skill.point.y);
            editPrice.value = skill.price !== undefined ? skill.price : '';
            editDescription.value = skill.description || '';
            
            // Render connections
            renderConnections(skill);
            
            // Show editor, hide placeholder
            skillEditor.style.display = 'flex';
            editorPlaceholder.style.display = 'none';
        } else {
            // Hide editor, show placeholder
            skillEditor.style.display = 'none';
            editorPlaceholder.style.display = 'flex';
        }
    };

    // Handle movement
    renderer.onSkillMove = (skill) => {
        if (skill) {
            editX.value = Math.round(skill.point.x);
            editY.value = Math.round(skill.point.y);
        }
    };

    // Handle input changes
    function updateSelectedSkill() {
        const skill = renderer.selectedSkill;
        if (!skill) return;

        skill.name = editName.value;
        skill.type = editType.value;
        skill.point.x = parseFloat(editX.value) || 0;
        skill.point.y = parseFloat(editY.value) || 0;
        
        const priceVal = parseFloat(editPrice.value);
        skill.price = isNaN(priceVal) ? undefined : priceVal;
        
        skill.description = editDescription.value;
        
        renderer.redraw();
    }

    [editName, editType, editX, editY, editPrice, editDescription].forEach(input => {
        input.addEventListener('input', updateSelectedSkill);
    });
    
    generateBtn.addEventListener('click', () => {
        try {
            const jsonText = jsonInput.value;
            const skills = parseSkillTree(jsonText);
            renderer.render(skills);
            showError('');
            console.log('Skill tree rendered successfully!');
        } catch (error) {
            showError(error.message);
            console.error('Error rendering skill tree:', error);
        }
    });
    
    // Reset view button
    resetViewBtn.addEventListener('click', () => {
        renderer.resetView();
    });
    
    // Allow Ctrl+Enter key in textarea to generate
    jsonInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            generateBtn.click();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // R key to reset view
        if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
            if (!jsonInput.contains(document.activeElement)) {
                renderer.resetView();
            }
        }
        // Plus/Minus for zoom
        if (e.key === '+' || e.key === '=') {
            e.preventDefault();
            const newScale = renderer.scale * 1.1;
            if (newScale <= renderer.maxScale) {
                renderer.scale = newScale;
                renderer.redraw();
            }
        }
        if (e.key === '-' || e.key === '_') {
            e.preventDefault();
            const newScale = renderer.scale * 0.9;
            if (newScale >= renderer.minScale) {
                renderer.scale = newScale;
                renderer.redraw();
            }
        }
    });

    // Render connections list
    function renderConnections(skill) {
        connectionsList.innerHTML = '';
        
        if (!skill.connections) {
            skill.connections = [];
        }
        
        if (skill.connections.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.color = '#888';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.style.fontSize = '0.9rem';
            emptyMsg.style.padding = '0.5rem';
            emptyMsg.textContent = 'No connections';
            connectionsList.appendChild(emptyMsg);
            return;
        }

        skill.connections.forEach((connection, index) => {
            const item = document.createElement('div');
            item.className = 'connection-item';
            
            // Header
            const header = document.createElement('div');
            header.className = 'connection-header';
            
            const title = document.createElement('span');
            title.className = 'connection-title';
            title.textContent = `Connection ${index + 1}`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-connection-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = 'Delete Connection';
            deleteBtn.addEventListener('click', () => {
                skill.connections.splice(index, 1);
                renderConnections(skill);
                renderer.redraw();
            });
            
            header.appendChild(title);
            header.appendChild(deleteBtn);
            item.appendChild(header);
            
            // Target Skill
            const targetGroup = document.createElement('div');
            targetGroup.className = 'form-group';
            const targetLabel = document.createElement('label');
            targetLabel.textContent = 'Target';
            const targetSelect = document.createElement('select');
            
            // Populate with other skills
            renderer.skills.forEach(s => {
                if (s.id !== skill.id) {
                    const option = document.createElement('option');
                    option.value = s.id;
                    option.textContent = s.name || s.id;
                    if (s.id === connection.targetSkillId) {
                        option.selected = true;
                    }
                    targetSelect.appendChild(option);
                }
            });
            
            targetSelect.addEventListener('change', (e) => {
                connection.targetSkillId = e.target.value;
                renderer.redraw();
            });
            
            targetGroup.appendChild(targetLabel);
            targetGroup.appendChild(targetSelect);
            item.appendChild(targetGroup);
            
            // Type
            const typeGroup = document.createElement('div');
            typeGroup.className = 'form-group';
            typeGroup.style.marginTop = '0.5rem';
            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Type';
            const typeSelect = document.createElement('select');
            
            ['line', 'ark'].forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                if (connection.type === type) {
                    option.selected = true;
                }
                typeSelect.appendChild(option);
            });
            
            typeSelect.addEventListener('change', (e) => {
                connection.type = e.target.value;
                // Initialize required properties if missing
                if (connection.type === 'ark' && !connection.circleCenter) {
                    connection.circleCenter = { x: 0, y: 0 };
                }
                if (connection.type === 'line' && !connection.wayPoints) {
                    connection.wayPoints = [];
                }
                renderConnections(skill); // Re-render to show/hide fields
                renderer.redraw();
            });
            
            typeGroup.appendChild(typeLabel);
            typeGroup.appendChild(typeSelect);
            item.appendChild(typeGroup);
            
            // Ark Center Fields
            if (connection.type === 'ark') {
                if (!connection.circleCenter) connection.circleCenter = { x: 0, y: 0 };
                
                const centerRow = document.createElement('div');
                centerRow.className = 'form-row';
                centerRow.style.marginTop = '0.5rem';
                
                // X
                const xGroup = document.createElement('div');
                xGroup.className = 'form-group';
                xGroup.innerHTML = '<label>Center X</label>';
                const xInput = document.createElement('input');
                xInput.type = 'number';
                xInput.value = connection.circleCenter.x;
                xInput.addEventListener('input', (e) => {
                    connection.circleCenter.x = parseFloat(e.target.value) || 0;
                    renderer.redraw();
                });
                xGroup.appendChild(xInput);
                
                // Y
                const yGroup = document.createElement('div');
                yGroup.className = 'form-group';
                yGroup.innerHTML = '<label>Center Y</label>';
                const yInput = document.createElement('input');
                yInput.type = 'number';
                yInput.value = connection.circleCenter.y;
                yInput.addEventListener('input', (e) => {
                    connection.circleCenter.y = parseFloat(e.target.value) || 0;
                    renderer.redraw();
                });
                yGroup.appendChild(yInput);
                
                centerRow.appendChild(xGroup);
                centerRow.appendChild(yGroup);
                item.appendChild(centerRow);
            }
            
            // Waypoints Fields
            if (connection.type === 'line') {
                const wpSection = document.createElement('div');
                wpSection.style.marginTop = '0.5rem';
                
                const wpHeader = document.createElement('div');
                wpHeader.innerHTML = '<label>Waypoints</label>';
                wpSection.appendChild(wpHeader);
                
                const wpList = document.createElement('div');
                wpList.className = 'waypoint-list';
                
                if (connection.wayPoints && connection.wayPoints.length > 0) {
                    connection.wayPoints.forEach((wp, wpIndex) => {
                        const wpItem = document.createElement('div');
                        wpItem.className = 'waypoint-item';
                        
                        // X
                        const wpX = document.createElement('input');
                        wpX.type = 'number';
                        wpX.placeholder = 'X';
                        wpX.style.width = '50px';
                        wpX.value = wp.x;
                        wpX.addEventListener('input', (e) => {
                            wp.x = parseFloat(e.target.value) || 0;
                            renderer.redraw();
                        });
                        
                        // Y
                        const wpY = document.createElement('input');
                        wpY.type = 'number';
                        wpY.placeholder = 'Y';
                        wpY.style.width = '50px';
                        wpY.value = wp.y;
                        wpY.addEventListener('input', (e) => {
                            wp.y = parseFloat(e.target.value) || 0;
                            renderer.redraw();
                        });
                        
                        const removeWp = document.createElement('button');
                        removeWp.className = 'remove-waypoint-btn';
                        removeWp.innerHTML = '&times;';
                        removeWp.title = 'Remove Waypoint';
                        removeWp.addEventListener('click', () => {
                            connection.wayPoints.splice(wpIndex, 1);
                            renderConnections(skill);
                            renderer.redraw();
                        });
                        
                        wpItem.appendChild(document.createTextNode('X:'));
                        wpItem.appendChild(wpX);
                        wpItem.appendChild(document.createTextNode('Y:'));
                        wpItem.appendChild(wpY);
                        wpItem.appendChild(removeWp);
                        wpList.appendChild(wpItem);
                    });
                }
                
                wpSection.appendChild(wpList);
                
                const addWpBtn = document.createElement('button');
                addWpBtn.className = 'add-waypoint-btn';
                addWpBtn.textContent = '+ Add Waypoint';
                addWpBtn.addEventListener('click', () => {
                    if (!connection.wayPoints) connection.wayPoints = [];
                    connection.wayPoints.push({ x: 0, y: 0 });
                    renderConnections(skill);
                    renderer.redraw();
                });
                wpSection.appendChild(addWpBtn);
                
                item.appendChild(wpSection);
            }
            
            connectionsList.appendChild(item);
        });
    }
    
    // Add Connection Button
    addConnectionBtn.addEventListener('click', () => {
        const skill = renderer.selectedSkill;
        if (!skill) return;
        
        // Find a default target (first available that isn't self)
        let targetId = null;
        for (const other of renderer.skills) {
            if (other.id !== skill.id) {
                targetId = other.id;
                break;
            }
        }
        
        if (!targetId) {
            alert('No other skills available to connect to.');
            return;
        }
        
        if (!skill.connections) skill.connections = [];
        
        skill.connections.push({
            targetSkillId: targetId,
            type: 'line',
            wayPoints: []
        });
        
        renderConnections(skill);
        renderer.redraw();
    });
});
