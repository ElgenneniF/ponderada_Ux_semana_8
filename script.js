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

const cor_do_rastro = "#add8e6"

svg.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);

    // Aplicar a repulsão nos pontos
    applyRepulsion(mx, my);

    // Calcular ângulo do movimento do mouse
    const angle = Math.atan2(my - lastMouseY, mx - lastMouseX);
    const offset = 15; // Distância entre as linhas paralelas
    const arcOffset = 25; // Distância do arco à frente do mouse

    // Posições das linhas paralelas
    const x1a = lastMouseX + offset * Math.cos(angle + Math.PI / 2);
    const y1a = lastMouseY + offset * Math.sin(angle + Math.PI / 2);
    const x2a = mx + offset * Math.cos(angle + Math.PI / 2);
    const y2a = my + offset * Math.sin(angle + Math.PI / 2);

    const x1b = lastMouseX - offset * Math.cos(angle + Math.PI / 2);
    const y1b = lastMouseY - offset * Math.sin(angle + Math.PI / 2);
    const x2b = mx - offset * Math.cos(angle + Math.PI / 2);
    const y2b = my - offset * Math.sin(angle + Math.PI / 2);

    // Posição do arco à frente do mouse
    const arcX = mx + arcOffset * Math.cos(angle);
    const arcY = my + arcOffset * Math.sin(angle);

    // Desenhar as duas linhas paralelas
    drawLine(x1a, y1a, x2a, y2a);
    drawLine(x1b, y1b, x2b, y2b);

    // Criar o arco à frente do mouse
    drawArc(arcX, arcY, x2a, y2a, x2b, y2b);

    // Atualizar a última posição do mouse
    lastMouseX = mx;
    lastMouseY = my;
});

// Variáveis para armazenar a última posição do mouse
let lastMouseX = width / 2;
let lastMouseY = height / 2;

// Ajuste na função drawLine para linhas mais grossas
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
        .attr("stroke-width", 5)
        .attr("x2", x2)
        .attr("y2", y2)
        .on("end", () => line.remove());
}

// Função para desenhar o arco na frente do mouse
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
        .on("end", () => arc.remove()); // Remove o arco depois da animação
}

// Zoom/Pan
const zoom = d3.zoom()
    .scaleExtent([0.5, 10]) // Definir os limites do zoom
    .on("zoom", function(event) {
        svg.attr("transform", event.transform); // Aplicar a transformação de zoom e pan
    });

svg.call(zoom);

// Inicializar os pontos e desenhá-los
drawPoints();
