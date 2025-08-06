class ViewportController {
    constructor(container, renderer) {
        this.container = container;
        this.renderer = renderer;
        this.viewport = {
            x: 0,
            y: 0,
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1
        };
        
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.lastViewport = { x: 0, y: 0 };
        
        this.setupEventListeners();
        this.setupMinimap();
    }

    setupEventListeners() {
        // マウスイベント
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.container.addEventListener('wheel', this.handleWheel.bind(this));
        
        // タッチイベント
        this.container.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.container.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.container.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // ウィンドウリサイズ
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // ズームスライダー
        const zoomSlider = document.getElementById('zoom-slider');
        zoomSlider.addEventListener('input', (e) => {
            this.setZoom(parseFloat(e.target.value));
        });
    }

    setupMinimap() {
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.viewportIndicator = document.getElementById('viewport-indicator');
        
        // ミニマップのサイズ設定
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 150;
    }

    handleMouseDown(e) {
        if (e.button === 0) {
            this.isDragging = true;
            this.dragStart = { x: e.clientX, y: e.clientY };
            this.lastViewport = { x: this.viewport.x, y: this.viewport.y };
        }
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.dragStart.x;
            const dy = e.clientY - this.dragStart.y;
            
            this.viewport.x = this.lastViewport.x - dx / this.viewport.scale;
            this.viewport.y = this.lastViewport.y - dy / this.viewport.scale;
            
            this.updateViewport();
        }
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    handleWheel(e) {
        e.preventDefault();
        
        const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // マウス位置を中心にズーム
        const worldX = this.viewport.x + mouseX / this.viewport.scale;
        const worldY = this.viewport.y + mouseY / this.viewport.scale;
        
        this.viewport.scale *= scaleFactor;
        this.viewport.scale = Math.max(0.1, Math.min(10, this.viewport.scale));
        
        this.viewport.x = worldX - mouseX / this.viewport.scale;
        this.viewport.y = worldY - mouseY / this.viewport.scale;
        
        this.updateViewport();
        this.updateZoomSlider();
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.isDragging = true;
            this.dragStart = { x: touch.clientX, y: touch.clientY };
            this.lastViewport = { x: this.viewport.x, y: this.viewport.y };
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.dragStart.x;
            const dy = touch.clientY - this.dragStart.y;
            
            this.viewport.x = this.lastViewport.x - dx / this.viewport.scale;
            this.viewport.y = this.lastViewport.y - dy / this.viewport.scale;
            
            this.updateViewport();
        }
    }

    handleTouchEnd(e) {
        this.isDragging = false;
    }

    handleResize() {
        this.viewport.width = window.innerWidth;
        this.viewport.height = window.innerHeight;
        this.updateViewport();
    }

    setZoom(scale) {
        const centerX = this.viewport.x + this.viewport.width / (2 * this.viewport.scale);
        const centerY = this.viewport.y + this.viewport.height / (2 * this.viewport.scale);
        
        this.viewport.scale = scale;
        
        this.viewport.x = centerX - this.viewport.width / (2 * this.viewport.scale);
        this.viewport.y = centerY - this.viewport.height / (2 * this.viewport.scale);
        
        this.updateViewport();
    }

    updateViewport() {
        this.renderer.setViewport(this.viewport);
        this.updateMinimap();
    }

    updateZoomSlider() {
        const zoomSlider = document.getElementById('zoom-slider');
        const zoomValue = document.getElementById('zoom-value');
        
        zoomSlider.value = this.viewport.scale;
        zoomValue.textContent = this.viewport.scale.toFixed(1);
    }

    updateMinimap() {
        // ミニマップの更新（簡易版）
        const scale = 0.01;
        const indicatorWidth = this.viewport.width * scale / this.viewport.scale;
        const indicatorHeight = this.viewport.height * scale / this.viewport.scale;
        const indicatorX = this.viewport.x * scale;
        const indicatorY = this.viewport.y * scale;
        
        this.viewportIndicator.style.width = `${indicatorWidth}px`;
        this.viewportIndicator.style.height = `${indicatorHeight}px`;
        this.viewportIndicator.style.left = `${indicatorX}px`;
        this.viewportIndicator.style.top = `${indicatorY}px`;
    }

    centerView(x, y) {
        this.viewport.x = x - this.viewport.width / (2 * this.viewport.scale);
        this.viewport.y = y - this.viewport.height / (2 * this.viewport.scale);
        this.updateViewport();
    }
}
