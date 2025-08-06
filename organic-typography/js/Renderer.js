class Renderer {
    constructor(svgElement) {
        // Replace the provided SVG with a canvas for WebGL rendering
        this.container = svgElement.parentElement || document.body;
        svgElement.remove();

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gl-canvas';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        // Flip the canvas vertically so that Y grows downward like SVG
        this.canvas.style.transform = 'scaleY(-1)';
        this.container.appendChild(this.canvas);

        // Default viewport information
        this.viewport = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1
        };

        this.maxInstances = 50000;
        this.isInitialized = false;

        // Stats
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 0;

        // Begin loading Three.js and setting up the scene
        this.initPromise = this.initThree();
    }

    async initThree() {
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js');
        this.THREE = THREE;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.viewport.width, this.viewport.height, false);

        this.scene = new THREE.Scene();

        const width = this.viewport.width / this.viewport.scale;
        const height = this.viewport.height / this.viewport.scale;
        this.camera = new THREE.OrthographicCamera(0, width, height, 0, -1000, 1000);
        this.camera.position.z = 10;

        // Basic square geometry for each node
        const geometry = new THREE.PlaneGeometry(5, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0x000000 });

        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.maxInstances);
        this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this.instancedMesh);

        this.dummy = new THREE.Object3D();
        this.isInitialized = true;
    }

    setViewport(viewport) {
        this.viewport = viewport;
        if (this.isInitialized) {
            this.updateCamera();
        }
    }

    updateCamera() {
        const { width, height, scale, x, y } = this.viewport;
        const w = width / scale;
        const h = height / scale;
        this.camera.left = x;
        this.camera.right = x + w;
        this.camera.top = y;
        this.camera.bottom = y + h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    render(nodes, connections) {
        if (!this.isInitialized) return;

        this.calculateFPS();

        const mesh = this.instancedMesh;
        const dummy = this.dummy;
        const count = Math.min(nodes.length, this.maxInstances);

        for (let i = 0; i < count; i++) {
            const node = nodes[i];
            dummy.position.set(node.position.x, node.position.y, 0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.count = count;
        mesh.instanceMatrix.needsUpdate = true;

        this.renderer.render(this.scene, this.camera);
    }

    calculateFPS() {
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastFrameTime;

        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            this.frameCount = 0;
            this.lastFrameTime = currentTime;

            const fpsElement = document.getElementById('fps');
            if (fpsElement) {
                fpsElement.textContent = this.fps;
            }
        }
    }

    clear() {
        if (this.instancedMesh) {
            this.instancedMesh.count = 0;
            this.renderer.clear();
        }
    }
}

window.Renderer = Renderer;
