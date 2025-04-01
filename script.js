const width = window.innerWidth;
const height = window.innerHeight;
const cor_do_rastro = "#add8e6";

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#3a86ff");

// Create a group for all water lilies
const liliesGroup = svg.append("g").attr("class", "lilies-group");
// Create a group for water effects
const effectsGroup = svg.append("g").attr("class", "effects-group");

// Generate random points for water lilies
const numPoints = 30;
const points = Array.from({ length: numPoints }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 20 + Math.random() * 10,
    vx: Math.random() * 0.5 - 0.25,
    vy: Math.random() * 0.5 - 0.25
}));

// Load SVG assets first
Promise.all([
    d3.xml("planta.svg"),
    d3.xml("flor.svg")
]).then(([planta, flor]) => {
    // Store the SVG nodes
    const plantaNode = planta.documentElement;
    const florNode = flor.documentElement;
    
    // Draw all water lilies
    const lilies = liliesGroup.selectAll(".vitoria-regia")
        .data(points)
        .enter()
        .append("g")
        .attr("class", "vitoria-regia")
        .attr("transform", d => `translate(${d.x}, ${d.y}) scale(${d.size / 50})`);
    
    // Add SVG elements to each lily
    lilies.each(function() {
        this.appendChild(plantaNode.cloneNode(true));
        this.appendChild(florNode.cloneNode(true));
    });
    
    // Create force simulation without centering forces
    const simulation = d3.forceSimulation(points)
        .force("collision", d3.forceCollide()
            .radius(d => d.size)
            .strength(0.7))
        .on("tick", () => {
            // Optional: Boundary constraints
            points.forEach(p => {
                p.x = Math.max(p.size, Math.min(width - p.size, p.x));
                p.y = Math.max(p.size, Math.min(height - p.size, p.y));
            });
            
            // Update positions
            liliesGroup.selectAll(".vitoria-regia")
                .attr("transform", d => `translate(${d.x}, ${d.y}) scale(${d.size / 50})`);
        });

// Mouse interaction variables
let lastMouseX = width / 2;
let lastMouseY = height / 2;
    
    // Single mousemove handler
    svg.on("mousemove", function(event) {
        const [mx, my] = d3.pointer(event);
        
        // Apply repulsion
        points.forEach(point => {
            const dx = point.x - mx;
            const dy = point.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = point.size * 2;
            
            if (dist < maxDistance) {
                const force = 1000 / (dist * dist);
                const angle = Math.atan2(dy, dx);
                point.vx += force * Math.cos(angle) * 0.1;
                point.vy += force * Math.sin(angle) * 0.1;
            }
        });
        simulation.alpha(0.3).restart();
        
        // Draw water effect
        const angle = Math.atan2(my - lastMouseY, mx - lastMouseX);
        const offset = 15;
        const arcOffset = 25;
        
        const x1a = lastMouseX + offset * Math.cos(angle + Math.PI / 2);
        const y1a = lastMouseY + offset * Math.sin(angle + Math.PI / 2);
        const x2a = mx + offset * Math.cos(angle + Math.PI / 2);
        const y2a = my + offset * Math.sin(angle + Math.PI / 2);
        
        const x1b = lastMouseX - offset * Math.cos(angle + Math.PI / 2);
        const y1b = lastMouseY - offset * Math.sin(angle + Math.PI / 2);
        const x2b = mx - offset * Math.cos(angle + Math.PI / 2);
        const y2b = my - offset * Math.sin(angle + Math.PI / 2);
        
        const arcX = mx + arcOffset * Math.cos(angle);
        const arcY = my + arcOffset * Math.sin(angle);
        
        drawLine(x1a, y1a, x2a, y2a);
        drawLine(x1b, y1b, x2b, y2b);
        drawArc(arcX, arcY, x2a, y2a, x2b, y2b);
        
        lastMouseX = mx;
        lastMouseY = my;
    });
    
    // Zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", function(event) {
            liliesGroup.attr("transform", event.transform);
            effectsGroup.attr("transform", event.transform);
        });
    
    svg.call(zoom);
});

function drawLine(x1, y1, x2, y2) {
    const line = effectsGroup.append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x1)
        .attr("y2", y1)
        .attr("stroke", cor_do_rastro)
        .attr("stroke-width", 5)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.8);

    line.transition()
        .duration(200)
        .ease(d3.easeSinInOut)
        .attr("stroke-width", 3)
        .attr("x2", x2)
        .attr("y2", y2)
        .on("end", () => line.remove());
}

function drawArc(arcX, arcY, x1, y1, x2, y2) {
    const arcPath = `M ${x1} ${y1} Q ${arcX} ${arcY} ${x2} ${y2}`;
    const arc = effectsGroup.append("path")
        .attr("d", arcPath)
        .attr("fill", "none")
        .attr("stroke", cor_do_rastro)
        .attr("stroke-width", 5)
        .attr("opacity", 0.8);

    arc.transition()
        .duration(50)
        .ease(d3.easeSinInOut)
        .attr("opacity", 0.6)
        .on("end", () => arc.remove());
}