class SpatialIndex {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.gridWidth = Math.ceil(width / cellSize);
        this.gridHeight = Math.ceil(height / cellSize);
        this.grid = new Map();
    }

    getGridKey(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);
        return `${gridX},${gridY}`;
    }

    insert(item) {
        const key = this.getGridKey(item.position.x, item.position.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(item);
    }

    query(position, radius) {
        const results = [];
        const gridRadius = Math.ceil(radius / this.cellSize);
        const centerX = Math.floor(position.x / this.cellSize);
        const centerY = Math.floor(position.y / this.cellSize);

        for (let dx = -gridRadius; dx <= gridRadius; dx++) {
            for (let dy = -gridRadius; dy <= gridRadius; dy++) {
                const key = `${centerX + dx},${centerY + dy}`;
                if (this.grid.has(key)) {
                    const items = this.grid.get(key);
                    for (const item of items) {
                        const dist = Math.sqrt(
                            Math.pow(item.position.x - position.x, 2) +
                            Math.pow(item.position.y - position.y, 2)
                        );
                        if (dist <= radius) {
                            results.push(item);
                        }
                    }
                }
            }
        }
        return results;
    }

    clear() {
        this.grid.clear();
    }
}
