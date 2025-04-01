const width = window.innerWidth;
const height = window.innerHeight;
const cor_do_rastro = "#add8e6";

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#3a86ff");

const liliesGroup = svg.append("g").attr("class", "lilies-group");
const effectsGroup = svg.append("g").attr("class", "effects-group");

const numPoints = 30;
const points = Array.from({ length: numPoints }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 20 + Math.random() * 10,
    vx: Math.random() * 0.5 - 0.25,
    vy: Math.random() * 0.5 - 0.25
}));

d3.xml("floreplanta.svg").then((floreplanta) => {
    const floreplantaNode = floreplanta.documentElement;

    const lilies = liliesGroup.selectAll(".vitoria-regia")
        .data(points)
        .enter()
        .append("g")
        .attr("class", "vitoria-regia")
        .attr("transform", d => `translate(${d.x}, ${d.y}) scale(${d.size / 50})`);

    lilies.each(function() {
        this.appendChild(floreplantaNode.cloneNode(true));
    });
});

const simulation = d3.forceSimulation(points)
    .force("collision", d3.forceCollide()
        .radius(d => d.size)
        .strength(0.7))
    .on("tick", () => {
        points.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.x = Math.max(p.size, Math.min(width - p.size, p.x));
            p.y = Math.max(p.size, Math.min(height - p.size, p.y));
        });

        liliesGroup.selectAll(".vitoria-regia")
            .attr("transform", d => `translate(${d.x}, ${d.y}) scale(${d.size / 50})`);
    });

let lastMouseX = width / 2;
let lastMouseY = height / 2;

svg.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);

    points.forEach(point => {
        const dx = point.x - mx;
        const dy = point.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = point.size * 2;

        if (dist < maxDistance) {
            const force = Math.min(1000 / (dist * dist), 2);
            const angle = Math.atan2(dy, dx);
            point.vx += force * Math.cos(angle) * 0.1;
            point.vy += force * Math.sin(angle) * 0.1;
        }
    });
    simulation.alpha(0.3).restart();

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

const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", function(event) {
        liliesGroup.attr("transform", event.transform);
        effectsGroup.attr("transform", event.transform);
    });

svg.call(zoom);

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
        .duration(400)
        .ease(d3.easeSinOut)
        .attr("stroke-width", 2)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("opacity", 0)
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
