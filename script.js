const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#3a86ff"); // Cor de fundo do SVG

// Gerar pontos aleatórios
const numPoints = 100;
const points = [];
for (let i = 0; i < numPoints; i++) {
    points.push({
        x: Math.random() * width,
        y: Math.random() * height
    });
}

// Função para desenhar os pontos
function drawPoints() {
    svg.selectAll("circle")
        .data(points)
        .enter()
        .append("circle")
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", 5)
        .attr("fill", "#ff5722"); // Cor dos pontos
}

// Função para aplicar a repulsão nos pontos
function applyRepulsion(mx, my) {
    const repulsionStrength = 500; // Aumentei a intensidade da repulsão para 500
    const maxDistance = 100; // Distância máxima para repulsão

    // Usando Quadtree para otimizar o cálculo da repulsão
    const quadtree = d3.quadtree()
        .x(d => d.x)
        .y(d => d.y)
        .addAll(points);

    points.forEach(point => {
        const dx = point.x - mx;
        const dy = point.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
            const force = repulsionStrength / (dist * dist);
            const angle = Math.atan2(dy, dx);

            point.x += force * Math.cos(angle);
            point.y += force * Math.sin(angle);
        }
    });

    svg.selectAll("circle")
        .data(points)
        .transition()
        .duration(50)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
}

// Função para desenhar o "rastro" da linha com o movimento do mouse
function drawLine(x1, y1, x2, y2) {
    const line = svg.append("line")
        .attr("x1", x1)
        .attr("y1", y1)
        .attr("x2", x1)
        .attr("y2", y1)
        .attr("stroke", "#1d3557")
        .attr("stroke-width", Math.random())
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.6);

    line.transition()
        .duration(500)
        .ease(d3.easeSinInOut)
        .attr("x2", x2)
        .attr("y2", y2)
        .on("end", () => line.remove());
}

// Detecção do movimento do mouse e desenhar as linhas de "rastro"
svg.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);

    const verticalOffset = Math.random() * 100 - 50;

    for (let i = 0; i < 20; i++) {
        const offsetX = Math.random() * 100 - 50;
        drawLine(mx + offsetX - 10, my + verticalOffset, mx + offsetX + 10, my + verticalOffset);
    }

    applyRepulsion(mx, my);
});

// Zoom/Pan
const zoom = d3.zoom()
    .scaleExtent([0.5, 10]) // Definir os limites do zoom
    .on("zoom", function(event) {
        svg.attr("transform", event.transform); // Aplicar a transformação de zoom e pan
    });

svg.call(zoom);

// Inicializar os pontos e desenhá-los
drawPoints();
