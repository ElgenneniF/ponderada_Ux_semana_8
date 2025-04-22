# Vitórias-Régias Interativas: Documentação Técnica

## Visão Geral

O projeto "Lírios d'Água" é uma experiência interativa digital que simula um ecossistema aquático com vitórias-régias reagindo ao movimento do cursor. Utilizando a biblioteca D3.js, este projeto cria uma visualização dinâmica onde elementos SVG representando plantas aquáticas respondem à presença e movimento do usuário, criando uma experiência imersiva e fluida.

## Principais Tecnologias e Técnicas Implementadas

### 1. Uso de Quadtree para Otimização de Colisões

Um dos destaques técnicos deste projeto é o uso da estrutura de dados Quadtree do D3.js para gerenciar eficientemente detecções de colisão e interações espaciais.

```javascript
// Função para criar e atualizar o quadtree
function createQuadtree(points) {
    return d3.quadtree()
        .x(d => d.x + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .y(d => d.y + (d.hitboxSize * (d.size / 50) * (window.hitboxScaleFactor || 1.0))/2)
        .addAll(points);
}
```

O Quadtree é utilizado para:

- **Eficiência computacional**: Em vez de verificar colisões entre todos os elementos (O(n²)), o Quadtree permite localizar rapidamente apenas os elementos próximos ao cursor (aproximadamente O(log n)).
- **Busca espacial otimizada**: O método `findPointsInRadius()` utiliza o Quadtree para encontrar rapidamente todas as vitórias-régias dentro de um raio específico do cursor.

```javascript
function findPointsInRadius(x, y, radius) {
    const pointsInRadius = [];
    
    quadtree.visit((node, x1, y1, x2, y2) => {
        // Lógica para encontrar pontos no raio
        // ...
        
        // Verificação otimizada: não visitar nós fora do raio de interesse
        return nodeDistSq > radius * radius;
    });
    
    return pointsInRadius;
}
```

### 2. Transições Animadas e Efeitos Visuais

O código implementa extensivamente transições D3 para criar uma experiência visual fluida e responsiva:

#### Efeitos de Rastro do Movimento do Cursor

```javascript
function drawLine(x1, y1, x2, y2) {
    const line = effectsGroup.append("line")
        // ... atributos iniciais ...
        
    line.transition()
        .duration(400)
        .ease(d3.easeSinOut)
        .attr("stroke-width", 2)
        .attr("x2", x2)
        .attr("y2", y2)
        .attr("opacity", 0)
        .on("end", () => line.remove());
}
```

As transições são usadas para:
- **Feedback visual de interação**: Quando o cursor passa sobre uma hitbox, uma transição de cor é aplicada
  ```javascript
  hitboxGroup.select(`.hitbox[data-id="${point.id}"]`)
      .attr("fill", "rgba(255, 255, 0, 0.3)")
      .transition()
      .duration(500)
      .attr("fill", "rgba(255, 0, 0, 0.2)");
  ```
- **Efeitos de desvanecimento**: Linhas e arcos que seguem o movimento do cursor aparecem e desaparecem gradualmente
- **Animações de raios de repulsão**: Os efeitos visuais dos raios de repulsão usam transições para indicar intensidade

### 3. Sistema de Zoom Interativo

O projeto implementa um sistema de zoom pan-and-zoom completo que permite aos usuários explorar o ambiente em diferentes escalas:

```javascript
const zoom = d3.zoom()
    .scaleExtent([0.5, 10])  // Limita o zoom entre 50% e 1000%
    .on("zoom", function(event) {
        liliesGroup.attr("transform", event.transform);
        effectsGroup.attr("transform", event.transform);
        hitboxGroup.attr("transform", event.transform);
    });

svg.call(zoom);
```

Características do sistema de zoom:
- **Consistência visual**: Todos os grupos de elementos (plantas, efeitos, hitboxes) são transformados de forma coerente
- **Limites de escala**: Definidos para evitar zoom excessivo ou insuficiente
- **Integração com interações**: O sistema mantém a funcionalidade de interação mesmo durante zoom ou pan

## Conclusão
O projeto "Lírios d'Água" demonstra uso avançado de D3.js para criar uma experiência interativa através de técnicas como Quadtree para otimização espacial, transições animadas para feedback visual, e um sistema de zoom para exploração do ambiente. O código implementa um sistema de física simplificado que, combinado com detecção de colisões, cria uma simulação orgânica de um ecossistema aquático respondendo à presença do usuário.

Para acessar o projeto desenvolvido acesse: https://elgennenif.github.io/Lirio-d-agua/