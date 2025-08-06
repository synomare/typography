class OrganicTypographyApp {
    constructor() {
        this.layout = null;
        this.renderer = null;
        this.viewportController = null;
        this.animationId = null;
        this.lastTime = 0;
        this.growthInterval = 50; // ミリ秒
        
        this.init();
    }

    init() {
        // レンダラーの初期化
        const svg = document.getElementById('text-canvas');
        this.renderer = new Renderer(svg);
        
        // ビューポートコントローラーの初期化
        const container = document.getElementById('canvas-container');
        this.viewportController = new ViewportController(container, this.renderer);
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 初期テキストの読み込み
        this.loadText();
    }

    setupEventListeners() {
        // テキスト読み込みボタン
        document.getElementById('load-text').addEventListener('click', () => {
            this.loadText();
        });
        
        // 成長制御ボタン
        document.getElementById('play-growth').addEventListener('click', () => {
            this.startGrowth();
        });
        
        document.getElementById('pause-growth').addEventListener('click', () => {
            this.pauseGrowth();
        });
        
        document.getElementById('reset-growth').addEventListener('click', () => {
            this.resetGrowth();
        });
        
        // 成長速度スライダー
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.growthInterval = 101 - parseInt(e.target.value);
        });
    }

    loadText() {
        const textInput = document.getElementById('text-input');
        const text = textInput.value || 'デフォルトテキスト';
        
        // キャンバスサイズの計算
        const canvasSize = Math.max(5000, Math.sqrt(text.length) * 100);
        
        // レイアウトエンジンの初期化
        this.layout = new OrganicLayout(text, canvasSize, canvasSize);
        this.layout.initialize();
        
        // ビューポートを中心に
        this.viewportController.centerView(canvasSize / 2, canvasSize / 2);
        
        // 統計情報の更新
        this.updateStats();
        
        // 初回レンダリング
        this.render();
    }

    startGrowth() {
        if (!this.layout) return;
        
        this.layout.start();
        this.animate();
    }

    pauseGrowth() {
        if (!this.layout) return;
        
        this.layout.pause();
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resetGrowth() {
        if (!this.layout) return;
        
        this.pauseGrowth();
        this.layout.reset();
        this.renderer.clear();
        this.render();
    }

    animate(currentTime = 0) {
        if (!this.layout || !this.layout.isGrowing) return;
        
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime >= this.growthInterval) {
            this.layout.grow();
            this.render();
            this.updateStats();
            this.lastTime = currentTime;
        }
        
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    render() {
        if (!this.layout) return;
        
        this.renderer.render(this.layout.nodes, this.layout.connections);
    }

    updateStats() {
        if (!this.layout) return;
        
        document.getElementById('char-count').textContent = this.layout.text.length;
        document.getElementById('node-count').textContent = this.layout.nodes.length;
    }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OrganicTypographyApp();
});
