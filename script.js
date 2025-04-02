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
const hitboxGroup = svg.append("g").attr("class", "hitbox-group");

// Controle de toggle para hitboxes
let showHitboxes = true;
const toggleButton = d3.select("body")
    .append("button")
    .style("position", "fixed")
    .style("top", "10px")
    .style("left", "10px")
    .style("z-index", "1000")
    .style("padding", "5px")
    .text("Ocultar Hitboxes")
    .on("click", function() {
        showHitboxes = !showHitboxes;
        hitboxGroup.style("visibility", showHitboxes ? "visible" : "hidden");
        d3.select(this).text(showHitboxes ? "Ocultar Hitboxes" : "Mostrar Hitboxes");
    });

const numPoints = 30;
const points = Array.from({ length: numPoints }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: 20 + Math.random() * 10,
    vx: Math.random() * 0.5 - 0.25,
    vy: Math.random() * 0.5 - 0.25,
    hitboxSize: 0, // Será calculado com base no SVG
    id: Math.random().toString(36).substr(2, 9),
    repulsionRadius: 0 // Raio de repulsão gradual
}));

// Função para criar e atualizar o quadtree
function createQuadtree(points) {
    return d3.quadtree()
        .x(d => d.x + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .y(d => d.y + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .addAll(points);
}

// Inicializar quadtree (será atualizado após o carregamento dos SVGs)
let quadtree = createQuadtree(points);

// Função para obter o tamanho do SVG (maior dimensão)
function getSVGSize(svgElement) {
    // Crie um container temporário para o SVG
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.visibility = "hidden";
    tempContainer.style.pointerEvents = "none";
    document.body.appendChild(tempContainer);
    
    // Clone o SVG e adicione ao container
    const clone = svgElement.cloneNode(true);
    tempContainer.appendChild(clone);
    
    // Obtenha todas as partes visíveis do SVG
    const allElements = tempContainer.querySelectorAll("path, circle, rect, ellipse, line, polyline, polygon");
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    // Para cada elemento, calcule as dimensões
    allElements.forEach(el => {
        const bbox = el.getBBox();
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
    });
    
    // Remover o container temporário
    document.body.removeChild(tempContainer);
    
    // Se não houver elementos, retornar um tamanho padrão
    if (minX === Infinity) {
        return 50;
    }
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Retornar o maior valor entre largura e altura para um quadrado que contém o SVG
    return Math.max(width, height);
}

// Função para carregar posições a partir de um CSV
function loadPositionsFromCSV() {
    d3.csv("lily_positions.csv").then(data => {
        // Processar dados do CSV e atualizar os pontos
        data.forEach((d, i) => {
            if (i < points.length) {
                points[i].x = +d.x * width;  // Converter para número e escalar para a largura da janela
                points[i].y = +d.y * height; // Converter para número e escalar para a altura da janela
                points[i].size = +d.size || (20 + Math.random() * 10); // Usar o tamanho do CSV ou gerar um
            }
        });
        
        // Atualizar visualização
        updateLilies();
        updateHitboxes();
        
        // Reconstruir quadtree com novas posições
        quadtree = createQuadtree(points);
        
        console.log("Posições carregadas do CSV");
    }).catch(error => {
        console.error("Erro ao carregar CSV, usando posições aleatórias:", error);
    });
}

// Tentar carregar CSV ao iniciar
loadPositionsFromCSV();

d3.xml("floreplanta.svg").then((floreplanta) => {
    const floreplantaNode = floreplanta.documentElement;
    
    // Obter o tamanho do SVG para criar hitboxes quadradas
    const svgSize = getSVGSize(floreplantaNode);
    console.log("SVG Size:", svgSize);
    
    // Atualizar os pontos com o tamanho calculado
    points.forEach(point => {
        point.hitboxSize = svgSize;
        // Definir um raio de repulsão maior do que a hitbox para efeito gradual
        point.repulsionRadius = svgSize * (point.size / 50) * 2.5;
    });

    const lilies = liliesGroup.selectAll(".vitoria-regia")
        .data(points)
        .enter()
        .append("g")
        .attr("class", "vitoria-regia")
        .attr("transform", d => `translate(${d.x}, ${d.y}) scale(${d.size / 50})`)
        .attr("data-id", d => d.id);

    lilies.each(function() {
        this.appendChild(floreplantaNode.cloneNode(true));
    });
    
    // Criar as hitboxes quadradas
    hitboxGroup.selectAll(".hitbox")
        .data(points)
        .enter()
        .append("rect")
        .attr("class", "hitbox")
        .attr("data-id", d => d.id)
        .attr("fill", "rgba(255, 0, 0, 0.2)")
        .attr("stroke", "red")
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-width", 2);
    
    // Visualização opcional do raio de repulsão
    hitboxGroup.selectAll(".repulsion-radius")
        .data(points)
        .enter()
        .append("circle")
        .attr("class", "repulsion-radius")
        .attr("data-id", d => d.id)
        .attr("fill", "none")
        .attr("stroke", "rgba(0, 255, 255, 0.3)")
        .attr("stroke-dasharray", "3,3")
        .attr("stroke-width", 1)
        .attr("cx", d => d.x + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .attr("cy", d => d.y + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .attr("r", d => d.repulsionRadius);
    
    // Atualizar quadtree após calcular os tamanhos
    quadtree = createQuadtree(points);
    
    // Atualizar posição e tamanho das hitboxes
    updateHitboxes();
});

// Função para atualizar a posição das vitórias-régias
function updateLilies() {
    liliesGroup.selectAll(".vitoria-regia")
        .attr("transform", d => `translate(${d.x}, ${d.y}) scale(${d.size / 50})`);
}

// Função para atualizar a posição e tamanho das hitboxes e raios de repulsão
function updateHitboxes() {
    // Atualizar hitboxes
    hitboxGroup.selectAll(".hitbox")
        .data(points)
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("width", d => d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))
        .attr("height", d => d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0));
    
    // Atualizar raios de repulsão
    hitboxGroup.selectAll(".repulsion-radius")
        .data(points)
        .attr("cx", d => d.x + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .attr("cy", d => d.y + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .attr("r", d => d.repulsionRadius * (window.hitboxScaleFactor || 1.0));
}

const simulation = d3.forceSimulation(points)
    .force("collision", d3.forceCollide()
        .radius(d => d.size)
        .strength(0.7))
    .on("tick", () => {
        points.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            
            // Aplicar atrito
            p.vx *= 0.98;
            p.vy *= 0.98;
            
            // Limitar a posição
            p.x = Math.max(p.size, Math.min(width - p.size, p.x));
            p.y = Math.max(p.size, Math.min(height - p.size, p.y));
        });

        // Atualizar quadtree com novas posições
        quadtree = createQuadtree(points);
        
        // Atualizar posição das vitórias-régias
        updateLilies();
        
        // Atualizar posição das hitboxes
        updateHitboxes();
    });

let lastMouseX = width / 2;
let lastMouseY = height / 2;

// Função para encontrar pontos dentro do raio de repulsão usando quadtree
function findPointsInRadius(x, y, radius) {
    const pointsInRadius = [];
    
    quadtree.visit((node, x1, y1, x2, y2) => {
        if (!node.length) {
            // É um nó folha com um ponto
            let point = node.data;
            const hitboxWidth = point.hitboxSize * (point.size / 50) * (window.hitboxScaleFactor || 1.0);
            const hitboxCenterX = point.x + hitboxWidth/2;
            const hitboxCenterY = point.y + hitboxWidth/2;
            
            const dx = hitboxCenterX - x;
            const dy = hitboxCenterY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < radius) {
                pointsInRadius.push({
                    point: point,
                    distance: dist,
                    dx: dx,
                    dy: dy
                });
            }
        }
        
        // Verificar se este nó da árvore pode conter pontos dentro do raio
        const nodeDistX = x < x1 ? x1 - x : x > x2 ? x - x2 : 0;
        const nodeDistY = y < y1 ? y1 - y : y > y2 ? y - y2 : 0;
        const nodeDistSq = nodeDistX * nodeDistX + nodeDistY * nodeDistY;
        
        // Se o nó estiver completamente fora do raio, não precisamos visitá-lo
        return nodeDistSq > radius * radius;
    });
    
    return pointsInRadius;
}

svg.on("mousemove", function(event) {
    const [mx, my] = d3.pointer(event);
    
    // Usar quadtree para encontrar pontos próximos
    const maxRepulsionRadius = Math.max(...points.map(p => p.repulsionRadius * (window.hitboxScaleFactor || 1.0)));
    const pointsToCheck = findPointsInRadius(mx, my, maxRepulsionRadius);
    
    pointsToCheck.forEach(({ point, distance, dx, dy }) => {
        // Repulsão gradual com base na distância
        const repulsionRadius = point.repulsionRadius * (window.hitboxScaleFactor || 1.0);
        
        if (distance < repulsionRadius) {
            // Calcular a hitbox
            const hitboxWidth = point.hitboxSize * (point.size / 50) * (window.hitboxScaleFactor || 1.0);
            const isInsideHitbox = mx >= point.x && mx <= point.x + hitboxWidth && 
                                 my >= point.y && my <= point.y + hitboxWidth;
            
            // Calcular o fator de repulsão baseado na proximidade
            const repulsionFactor = 1 - (distance / repulsionRadius);
            const angle = Math.atan2(dy, dx);
            
            // Força base
            let force;
            
            if (isInsideHitbox) {
                // Força máxima se estiver dentro da hitbox
                force = 8;
                
                // Indicação visual
                hitboxGroup.select(`.hitbox[data-id="${point.id}"]`)
                    .attr("fill", "rgba(255, 255, 0, 0.3)")
                    .transition()
                    .duration(500)
                    .attr("fill", "rgba(255, 0, 0, 0.2)");
            } else {
                // Força gradual baseada na proximidade
                force = 5 * Math.pow(repulsionFactor, 2); // O quadrado dá uma curva não-linear para repulsão
            }
            
            // Aplicar a força com suavização
            point.vx += force * Math.cos(angle) * 0.1;
            point.vy += force * Math.sin(angle) * 0.1;
            
            // Efeito visual para o raio de repulsão (opcional)
            if (repulsionFactor > 0.1) {
                hitboxGroup.select(`.repulsion-radius[data-id="${point.id}"]`)
                    .attr("stroke", `rgba(0, 255, 255, ${repulsionFactor * 0.5})`)
                    .attr("stroke-width", 1 + repulsionFactor);
            }
        } else {
            // Resetar efeito visual para o raio de repulsão
            hitboxGroup.select(`.repulsion-radius[data-id="${point.id}"]`)
                .attr("stroke", "rgba(0, 255, 255, 0.3)")
                .attr("stroke-width", 1);
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
        hitboxGroup.attr("transform", event.transform);
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

// Botão para salvar posições atuais em CSV
const saveButton = d3.select("body")
    .append("button")
    .style("position", "fixed")
    .style("top", "10px")
    .style("right", "10px")
    .style("z-index", "1000")
    .style("padding", "5px")
    .text("Salvar Posições")
    .on("click", function() {
        savePositionsToCSV();
    });

// Função para salvar posições em CSV
function savePositionsToCSV() {
    // Normalizar posições para valores entre 0-1 para portabilidade
    const csvData = points.map(p => ({
        x: (p.x / width).toFixed(4),
        y: (p.y / height).toFixed(4),
        size: p.size.toFixed(2),
        id: p.id
    }));
    
    // Converter para string CSV
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(obj => Object.values(obj).join(','));
    const csvString = [headers, ...rows].join('\n');
    
    // Criar um blob e link para download
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'lily_positions.csv');
    a.click();
}

// Adicionar controle para mostrar/ocultar raios de repulsão
const repulsionToggleButton = d3.select("body")
    .append("button")
    .style("position", "fixed")
    .style("top", "10px")
    .style("left", "150px")
    .style("z-index", "1000")
    .style("padding", "5px")
    .text("Ocultar Raios de Repulsão")
    .on("click", function() {
        const repulsionVisible = hitboxGroup.selectAll(".repulsion-radius").style("visibility") !== "hidden";
        hitboxGroup.selectAll(".repulsion-radius").style("visibility", repulsionVisible ? "hidden" : "visible");
        d3.select(this).text(repulsionVisible ? "Mostrar Raios de Repulsão" : "Ocultar Raios de Repulsão");
    });

// Controle deslizante para ajuste da escala da hitbox
const controlsDiv = d3.select("body")
    .append("div")
    .style("position", "fixed")
    .style("bottom", "10px")
    .style("left", "10px")
    .style("background", "rgba(255, 255, 255, 0.8)")
    .style("padding", "10px")
    .style("border-radius", "5px");

controlsDiv.append("div")
    .text("Fator de Escala da Hitbox: ");

controlsDiv.append("input")
    .attr("type", "range")
    .attr("min", "0.5")
    .attr("max", "2")
    .attr("step", "0.1")
    .attr("value", "1.0")
    .style("width", "150px")
    .on("input", function() {
        const factor = parseFloat(this.value);
        controlsDiv.select("span").text(factor.toFixed(1));
        
        // Salvar o fator de escala para uso no cálculo das hitboxes
        window.hitboxScaleFactor = factor;
        
        // Atualizar tamanho das hitboxes
        updateHitboxes();
        
        // Reconstruir quadtree com novo fator de escala
        quadtree = createQuadtree(points);
    });

window.hitboxScaleFactor = 1.0; // Fator de escala inicial

controlsDiv.append("span")
    .text("1.0");

// Adicionar controle deslizante para ajuste do raio de repulsão
const repulsionControlsDiv = d3.select("body")
    .append("div")
    .style("position", "fixed")
    .style("bottom", "60px")
    .style("left", "10px")
    .style("background", "rgba(255, 255, 255, 0.8)")
    .style("padding", "10px")
    .style("border-radius", "5px");

repulsionControlsDiv.append("div")
    .text("Fator do Raio de Repulsão: ");

repulsionControlsDiv.append("input")
    .attr("type", "range")
    .attr("min", "1")
    .attr("max", "5")
    .attr("step", "0.5")
    .attr("value", "2.5")
    .style("width", "150px")
    .on("input", function() {
        const factor = parseFloat(this.value);
        repulsionControlsDiv.select("span").text(factor.toFixed(1));
        
        // Atualizar o raio de repulsão para todos os pontos
        points.forEach(point => {
            point.repulsionRadius = point.hitboxSize * (point.size / 50) * factor;
        });
        
        // Atualizar a visualização
        updateHitboxes();
    });

repulsionControlsDiv.append("span")
    .text("2.5");

// Mostrar quadtree (opcional, para debug)
const debugQuadtreeButton = d3.select("body")
    .append("button")
    .style("position", "fixed")
    .style("top", "10px")
    .style("left", "350px")
    .style("z-index", "1000")
    .style("padding", "5px")
    .text("Mostrar Quadtree")
    .on("click", function() {
        const showingQuadtree = svg.select(".quadtree-debug").size() > 0;
        
        if (showingQuadtree) {
            svg.select(".quadtree-debug").remove();
            d3.select(this).text("Mostrar Quadtree");
        } else {
            // Desenhar linhas do quadtree
            const quadtreeGroup = svg.append("g")
                .attr("class", "quadtree-debug");
                
            quadtree.visit(function(node, x1, y1, x2, y2) {
                quadtreeGroup.append("rect")
                    .attr("x", x1)
                    .attr("y", y1)
                    .attr("width", x2 - x1)
                    .attr("height", y2 - y1)
                    .attr("fill", "none")
                    .attr("stroke", "rgba(0, 0, 0, 0.3)")
                    .attr("stroke-width", 1);
                
                return false; // continue traversing
            });
            
            d3.select(this).text("Ocultar Quadtree");
        }
    });