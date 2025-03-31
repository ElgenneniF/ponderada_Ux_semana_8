const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#3a86ff");

// Gerar pontos aleatórios para as vitórias-régias
const numPoints = 30;
const points = [];
for (let i = 0; i < numPoints; i++) {
    points.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 20 + Math.random() * 10 // Tamanho variável
    });
}

// Função para desenhar vitórias-régias a partir de arquivos SVG
function drawVitoriaRegia() {
    points.forEach(point => {
        Promise.all([
            d3.xml("planta.svg"),
            d3.xml("flor.svg")
        ]).then(([planta, flor]) => {
            const group = svg.append("g")
                .attr("class", "vitoria-regia")
                .attr("transform", `translate(${point.x}, ${point.y}) scale(${point.size / 50})`);
            
            group.node().appendChild(planta.documentElement.cloneNode(true));
            group.node().appendChild(flor.documentElement.cloneNode(true));
        });
    });
}

drawVitoriaRegia();

// Função para aplicar a repulsão considerando o tamanho da vitória-régia
function applyRepulsion(mx, my) {
    const repulsionStrength = 1000;
    points.forEach(point => {
        const dx = point.x - mx;
        const dy = point.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = point.size * 2; // Ajuste da "hitbox" com base no tamanho

        if (dist < maxDistance) {
            const force = repulsionStrength / (dist * dist);
            const angle = Math.atan2(dy, dx);
            point.x += force * Math.cos(angle);
            point.y += force * Math.sin(angle);
        }
    });

    svg.selectAll(".vitoria-regia")
        .data(points)
        .transition()
        .duration(50)
        .attr("transform", d => `translate(${d.x}, ${d.y}) scale(${d.size / 50})`);
}

// Detectar movimento do mouse
svg.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);
    applyRepulsion(mx, my);
});


const cor_do_rastro = "#add8e6";

svg.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);
    applyRepulsion(mx, my);
    
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

let lastMouseX = width / 2;
let lastMouseY = height / 2;

function drawLine(x1, y1, x2, y2) {
    const line = svg.append("line")
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
    const arc = svg.append("path")
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

const zoom = d3.zoom()
    .scaleExtent([0.5, 10])
    .on("zoom", function(event) {
        svg.attr("transform", event.transform);
    });

svg.call(zoom);