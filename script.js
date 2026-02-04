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
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        // Mouse move - pan
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                
                this.offsetX += dx;
                this.offsetY += dy;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                this.redraw();
            }
        });
        
        // Mouse up - stop dragging
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Mouse leave - stop dragging
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
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
        
        // Draw border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
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
});
