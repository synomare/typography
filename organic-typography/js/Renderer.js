class Renderer {
    constructor(svgElement) {
        this.svg = svgElement;
        this.textLayer = document.getElementById('text-layer');
        this.connectionLayer = document.getElementById('connection-layer');
        this.viewport = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1
        };
        
        this.renderQueue = [];
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 0;
    }

    setViewport(viewport) {
        this.viewport = viewport;
        this.updateViewBox();
    }

    updateViewBox() {
        const viewBox = `${this.viewport.x} ${this.viewport.y} ${this.viewport.width / this.viewport.scale} ${this.viewport.height / this.viewport.scale}`;
        this.svg.setAttribute('viewBox', viewBox);
    }

    render(nodes, connections) {
        // FPS計算
        this.calculateFPS();
        
        // ビューポート内の要素のみレンダリング
        const visibleNodes = this.cullNodes(nodes);
        const visibleConnections = this.cullConnections(connections, nodes);
        
        // 差分レンダリング
        this.renderConnections(visibleConnections, nodes);
        this.renderNodes(visibleNodes);
    }

    cullNodes(nodes) {
        const buffer = 100;
        const minX = this.viewport.x - buffer;
        const maxX = this.viewport.x + this.viewport.width / this.viewport.scale + buffer;
        const minY = this.viewport.y - buffer;
        const maxY = this.viewport.y + this.viewport.height / this.viewport.scale + buffer;
        
        return nodes.filter(node => 
            node.position.x >= minX && 
            node.position.x <= maxX && 
            node.position.y >= minY && 
            node.position.y <= maxY
        );
    }

    cullConnections(connections, allNodes) {
        const nodeMap = new Map(allNodes.map(n => [n.id, n]));
        const visibleConnections = [];
        
        for (const conn of connections) {
            const fromNode = nodeMap.get(conn.from);
            const toNode = nodeMap.get(conn.to);
            
            if (fromNode && toNode) {
                // 簡易的な線分とビューポートの交差判定
                if (this.lineIntersectsViewport(fromNode.position, toNode.position)) {
                    visibleConnections.push(conn);
                }
            }
        }
        
        return visibleConnections;
    }

    lineIntersectsViewport(p1, p2) {
        const minX = this.viewport.x;
        const maxX = this.viewport.x + this.viewport.width / this.viewport.scale;
        const minY = this.viewport.y;
        const maxY = this.viewport.y + this.viewport.height / this.viewport.scale;
        
        // 両端点がビューポート外で同じ側にある場合は除外
        if ((p1.x < minX && p2.x < minX) || (p1.x > maxX && p2.x > maxX) ||
            (p1.y < minY && p2.y < minY) || (p1.y > maxY && p2.y > maxY)) {
            return false;
        }
        
        return true;
    }

    renderNodes(nodes) {
        // 既存のノードを管理
        const existingNodes = new Map();
        const textElements = this.textLayer.querySelectorAll('text');
        textElements.forEach(elem => {
            existingNodes.set(elem.id, elem);
        });
        
        // 新規追加・更新
        nodes.forEach(node => {
            let elem = existingNodes.get(node.id);
            
            if (!elem) {
                elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                elem.id = node.id;
                elem.classList.add('text-node');
                elem.textContent = node.char;
                this.textLayer.appendChild(elem);
            }
            
            elem.setAttribute('x', node.position.x);
            elem.setAttribute('y', node.position.y);
            elem.setAttribute('font-size', this.calculateFontSize(node));
            
            if (node.energy < 30) {
                elem.classList.add('fading');
            }
            
            existingNodes.delete(node.id);
        });
        
        // 不要な要素を削除
        existingNodes.forEach(elem => {
            elem.remove();
        });
    }

    renderConnections(connections, allNodes) {
        const nodeMap = new Map(allNodes.map(n => [n.id, n]));
        
        // 既存の接続線をクリア
        this.connectionLayer.innerHTML = '';
        
        connections.forEach(conn => {
            const fromNode = nodeMap.get(conn.from);
            const toNode = nodeMap.get(conn.to);
            
            if (!fromNode || !toNode) return;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('connection-line', conn.type);
            
            // ベジェ曲線の計算
            const dx = toNode.position.x - fromNode.position.x;
            const dy = toNode.position.y - fromNode.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const curvature = conn.curvature || 0.2;
            const controlX = fromNode.position.x + dx * 0.5 + dy * curvature * 0.3;
            const controlY = fromNode.position.y + dy * 0.5 - dx * curvature * 0.3;
            
            const d = `M ${fromNode.position.x} ${fromNode.position.y} Q ${controlX} ${controlY} ${toNode.position.x} ${toNode.position.y}`;
            path.setAttribute('d', d);
            
            this.connectionLayer.appendChild(path);
        });
    }

    calculateFontSize(node) {
        // ズームレベルに応じてフォントサイズを調整
        const baseSize = 16;
        const scale = this.viewport.scale;
        
        if (scale < 0.5) {
            return baseSize * 2;
        } else if (scale > 2) {
            return baseSize * 0.8;
        }
        
        return baseSize;
    }

    calculateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;
        
        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastFrameTime = currentTime;
            
            // FPS表示を更新
            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = this.fps;
            }
        }
    }

    clear() {
        this.textLayer.innerHTML = '';
        this.connectionLayer.innerHTML = '';
    }
}
