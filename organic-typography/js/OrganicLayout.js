class OrganicLayout {
    constructor(text, canvasWidth, canvasHeight) {
        this.text = text;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.nodes = [];
        this.connections = [];
        this.spatialIndex = new SpatialIndex(canvasWidth, canvasHeight, 50);
        this.growthQueue = [];
        this.generation = 0;
        this.isGrowing = false;
        
        // 成長パラメータ
        this.params = {
            initialEnergy: 100,
            energyDecay: 0.3,
            straightPreference: 0.9,
            branchProbability: 0.15,
            intersectionPenalty: 50,
            coilingThreshold: 30,
            characterSpacing: 18,
            lineSpacing: 20
        };
    }

    initialize() {
        // 初期シードの生成
        const seedCount = Math.max(3, Math.floor(Math.sqrt(this.text.length) / 5));
        const centerX = this.canvasWidth / 2;
        const centerY = this.canvasHeight / 2;
        
        for (let i = 0; i < seedCount; i++) {
            const angle = (i / seedCount) * Math.PI * 2;
            const radius = 100 + Math.random() * 50;
            const seed = {
                id: `node_${this.nodes.length}`,
                char: this.text[0],
                position: {
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                },
                velocity: {
                    dx: Math.cos(angle + (Math.random() - 0.5) * 0.5),
                    dy: Math.sin(angle + (Math.random() - 0.5) * 0.5)
                },
                energy: this.params.initialEnergy,
                generation: 0,
                textIndex: i * Math.floor(this.text.length / seedCount),
                parent: null,
                children: [],
                curvature: 0
            };
            
            this.nodes.push(seed);
            this.spatialIndex.insert(seed);
            this.growthQueue.push(seed);
        }
    }

    grow() {
        if (!this.isGrowing || this.growthQueue.length === 0) return;
        
        const newQueue = [];
        
        for (const node of this.growthQueue) {
            if (node.energy <= 0 || node.textIndex >= this.text.length - 1) continue;
            
            // 近隣ノードの検出
            const nearbyNodes = this.spatialIndex.query(node.position, 50);
            
            // 成長方向の計算
            const growthDir = this.calculateGrowthDirection(node, nearbyNodes);
            
            // エネルギー減少による曲率の増加
            const curvature = (this.params.initialEnergy - node.energy) / this.params.initialEnergy;
            const curvedDir = this.applyCurvature(growthDir, curvature * 0.5);
            
            // 新しいノードの生成
            const newNode = {
                id: `node_${this.nodes.length}`,
                char: this.text[node.textIndex + 1],
                position: {
                    x: node.position.x + curvedDir.dx * this.params.characterSpacing,
                    y: node.position.y + curvedDir.dy * this.params.characterSpacing
                },
                velocity: curvedDir,
                energy: node.energy - this.params.energyDecay,
                generation: node.generation + 1,
                textIndex: node.textIndex + 1,
                parent: node.id,
                children: [],
                curvature: curvature
            };
            
            // 交差チェック
            if (!this.checkIntersection(newNode, nearbyNodes)) {
                this.nodes.push(newNode);
                this.spatialIndex.insert(newNode);
                node.children.push(newNode.id);
                newQueue.push(newNode);
                
                // 接続の追加
                this.connections.push({
                    from: node.id,
                    to: newNode.id,
                    type: node.energy > this.params.coilingThreshold ? 'primary' : 'secondary',
                    curvature: curvature
                });
                
                // 分岐判定
                if (Math.random() < this.params.branchProbability && node.energy > 50) {
                    const branchNode = this.createBranch(node, nearbyNodes);
                    if (branchNode) {
                        newQueue.push(branchNode);
                    }
                }
            } else {
                // 交差回避のための分岐
                const avoidanceNode = this.createAvoidanceBranch(node, nearbyNodes);
                if (avoidanceNode) {
                    newQueue.push(avoidanceNode);
                }
            }
        }
        
        this.growthQueue = newQueue;
        this.generation++;
    }

    calculateGrowthDirection(node, nearbyNodes) {
        let direction = { ...node.velocity };
        
        // 近隣ノードからの反発力
        for (const nearby of nearbyNodes) {
            if (nearby.id === node.id) continue;
            
            const dx = node.position.x - nearby.position.x;
            const dy = node.position.y - nearby.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                const force = (30 - dist) / 30;
                direction.dx += (dx / dist) * force * 0.3;
                direction.dy += (dy / dist) * force * 0.3;
            }
        }
        
        // 正規化
        const mag = Math.sqrt(direction.dx * direction.dx + direction.dy * direction.dy);
        return {
            dx: direction.dx / mag,
            dy: direction.dy / mag
        };
    }

    applyCurvature(direction, curvature) {
        const angle = Math.atan2(direction.dy, direction.dx);
        const curveAngle = angle + (Math.random() - 0.5) * curvature * Math.PI;
        
        return {
            dx: Math.cos(curveAngle),
            dy: Math.sin(curveAngle)
        };
    }

    checkIntersection(node, nearbyNodes) {
        for (const nearby of nearbyNodes) {
            const dx = node.position.x - nearby.position.x;
            const dy = node.position.y - nearby.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 15) {
                return true;
            }
        }
        return false;
    }

    createBranch(parentNode, nearbyNodes) {
        const branchAngle = Math.atan2(parentNode.velocity.dy, parentNode.velocity.dx) + 
                          (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 4 + Math.random() * Math.PI / 4);
        
        const branchNode = {
            id: `node_${this.nodes.length}`,
            char: this.text[parentNode.textIndex + 1],
            position: {
                x: parentNode.position.x + Math.cos(branchAngle) * this.params.characterSpacing,
                y: parentNode.position.y + Math.sin(branchAngle) * this.params.characterSpacing
            },
            velocity: {
                dx: Math.cos(branchAngle),
                dy: Math.sin(branchAngle)
            },
            energy: parentNode.energy * 0.7,
            generation: parentNode.generation + 1,
            textIndex: parentNode.textIndex + 1,
            parent: parentNode.id,
            children: [],
            curvature: 0
        };
        
        if (!this.checkIntersection(branchNode, nearbyNodes)) {
            this.nodes.push(branchNode);
            this.spatialIndex.insert(branchNode);
            parentNode.children.push(branchNode.id);
            
            this.connections.push({
                from: parentNode.id,
                to: branchNode.id,
                type: 'tertiary',
                curvature: 0.2
            });
            
            return branchNode;
        }
        
        return null;
    }

    createAvoidanceBranch(parentNode, nearbyNodes) {
        // 最も空いている方向を探す
        let bestAngle = null;
        let maxDistance = 0;
        
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const testPos = {
                x: parentNode.position.x + Math.cos(angle) * this.params.characterSpacing,
                y: parentNode.position.y + Math.sin(angle) * this.params.characterSpacing
            };
            
            let minDist = Infinity;
            for (const nearby of nearbyNodes) {
                const dist = Math.sqrt(
                    Math.pow(testPos.x - nearby.position.x, 2) +
                    Math.pow(testPos.y - nearby.position.y, 2)
                );
                minDist = Math.min(minDist, dist);
            }
            
            if (minDist > maxDistance) {
                maxDistance = minDist;
                bestAngle = angle;
            }
        }
        
        if (bestAngle !== null && maxDistance > 15) {
            return this.createBranch(parentNode, nearbyNodes);
        }
        
        return null;
    }

    start() {
        this.isGrowing = true;
    }

    pause() {
        this.isGrowing = false;
    }

    reset() {
        this.nodes = [];
        this.connections = [];
        this.growthQueue = [];
        this.generation = 0;
        this.isGrowing = false;
        this.spatialIndex.clear();
        this.initialize();
    }
}
