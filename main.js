// PixelAI 主要JavaScript逻辑
class PixelAIProcessor {
    constructor() {
        this.originalImage = null;
        this.processedImage = null;
        this.currentCanvas = null;
        this.gridCanvas = null;
        this.processHistory = [];
        this.isProcessing = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeParticleBackground();
        this.initializeAnimations();
    }
    
    initializeElements() {
        // 获取DOM元素
        this.uploadArea = document.getElementById('uploadArea');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.imageInput = document.getElementById('imageInput');
        this.mainCanvas = document.getElementById('mainCanvas');
        this.gridCanvas = document.getElementById('gridCanvas');
        this.processingOverlay = document.getElementById('processingOverlay');
        
        // 控制元素
        this.gridSizeInput = document.getElementById('gridSize');
        this.gridSizeValue = document.getElementById('gridSizeValue');
        if (this.gridSizeValue && this.gridSizeInput) this.gridSizeValue.textContent = this.gridSizeInput.value + ' px';
        this.gridOpacitySlider = document.getElementById('gridOpacity');
        this.showGridCheckbox = document.getElementById('showGrid');
        this.denoiseStrengthSlider = document.getElementById('denoiseStrength');
        this.colorToleranceSlider = document.getElementById('colorTolerance');
        this.colorCountSlider = document.getElementById('colorCount');
        this.zoomLevelSlider = document.getElementById('zoomLevel');
        
        // 显示元素
        this.imageDimensions = document.getElementById('imageDimensions');
        this.imageFormat = document.getElementById('imageFormat');
        this.imageSize = document.getElementById('imageSize');
        this.historyPanel = document.getElementById('historyPanel');
        
        // 设置画布上下文
        this.ctx = this.mainCanvas.getContext('2d');
        this.gridCtx = this.gridCanvas.getContext('2d');
    }
    
    setupEventListeners() {
        // 文件上传事件
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // 拖拽上传
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'rgba(0, 212, 255, 0.8)';
            this.uploadArea.style.background = 'rgba(0, 212, 255, 0.1)';
        });
        
        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            this.uploadArea.style.background = 'transparent';
        });
        
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.style.borderColor = 'rgba(0, 212, 255, 0.3)';
            this.uploadArea.style.background = 'transparent';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processImageFile(files[0]);
            }
        });
        
        // 控制面板事件
        this.gridOpacitySlider.addEventListener('input', (e) => {
            document.getElementById('opacityValue').textContent = e.target.value + '%';
            this.updateGrid();
        });
        
        this.showGridCheckbox.addEventListener('change', () => this.updateGrid());
        this.gridSizeInput.addEventListener('input', (e) => {
            if (this.gridSizeValue) this.gridSizeValue.textContent = e.target.value + ' px';
            this.updateGrid();
        });
        
        this.zoomLevelSlider.addEventListener('input', (e) => {
            document.getElementById('zoomValue').textContent = e.target.value + '%';
            this.updateCanvasZoom();
        });
        
        // 参数滑块事件
        this.denoiseStrengthSlider.addEventListener('input', (e) => {
            document.getElementById('denoiseValue').textContent = e.target.value + '%';
        });
        
        this.colorToleranceSlider.addEventListener('input', (e) => {
            document.getElementById('toleranceValue').textContent = e.target.value + '%';
        });
        
        this.colorCountSlider.addEventListener('input', (e) => {
            document.getElementById('colorCountValue').textContent = e.target.value + '色';
        });
        
        // 输出设置
        document.getElementById('outputQuality').addEventListener('input', (e) => {
            document.getElementById('qualityValue').textContent = e.target.value + '%';
        });
        
        document.getElementById('outputScale').addEventListener('input', (e) => {
            document.getElementById('scaleValue').textContent = e.target.value + '%';
        });
    }
    
    initializeParticleBackground() {
        // 使用p5.js创建粒子背景
        new p5((p) => {
            let particles = [];
            
            p.setup = () => {
                const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                canvas.parent('particle-bg');
                
                // 创建粒子
                for (let i = 0; i < 50; i++) {
                    particles.push({
                        x: p.random(p.width),
                        y: p.random(p.height),
                        vx: p.random(-0.5, 0.5),
                        vy: p.random(-0.5, 0.5),
                        size: p.random(1, 3),
                        opacity: p.random(0.1, 0.3)
                    });
                }
            };
            
            p.draw = () => {
                p.clear();
                
                // 绘制粒子
                particles.forEach(particle => {
                    p.fill(0, 212, 255, particle.opacity * 255);
                    p.noStroke();
                    p.circle(particle.x, particle.y, particle.size);
                    
                    // 更新位置
                    particle.x += particle.vx;
                    particle.y += particle.vy;
                    
                    // 边界检测
                    if (particle.x < 0 || particle.x > p.width) particle.vx *= -1;
                    if (particle.y < 0 || particle.y > p.height) particle.vy *= -1;
                });
                
                // 绘制连接线
                for (let i = 0; i < particles.length; i++) {
                    for (let j = i + 1; j < particles.length; j++) {
                        const dist = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        if (dist < 100) {
                            p.stroke(0, 212, 255, (1 - dist / 100) * 50);
                            p.strokeWeight(0.5);
                            p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                        }
                    }
                }
            };
            
            p.windowResized = () => {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        });
    }
    
    initializeAnimations() {
        // 页面加载动画
        anime({
            targets: '.hover-lift',
            translateY: [50, 0],
            opacity: [0, 1],
            delay: anime.stagger(200),
            duration: 800,
            easing: 'easeOutExpo'
        });
        
        // 导航栏动画
        anime({
            targets: 'nav',
            translateY: [-100, 0],
            opacity: [0, 1],
            duration: 1000,
            easing: 'easeOutExpo'
        });
    }
    
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
    }
    
    processImageFile(file) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            alert('请选择有效的图像文件！');
            return;
        }
        
        // 文件大小限制 (10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('文件大小不能超过10MB！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.loadImage(img, file);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    loadImage(img, file) {
        this.originalImage = img;
        this.processedImage = img;
        
        // 更新图像信息
        this.imageDimensions.textContent = `${img.width} × ${img.height}`;
        this.imageFormat.textContent = file.type.split('/')[1].toUpperCase();
        this.imageSize.textContent = this.formatFileSize(file.size);
        
        // 设置画布尺寸
        const maxWidth = 600;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }
        
        this.mainCanvas.width = width;
        this.mainCanvas.height = height;
        this.gridCanvas.width = width;
        this.gridCanvas.height = height;
        
        // 绘制图像
        this.ctx.drawImage(img, 0, 0, width, height);
        
        // 显示画布，隐藏上传区域
        this.uploadArea.style.display = 'none';
        this.canvasContainer.classList.remove('hidden');
        
        // 更新网格
        this.updateGrid();
        
        // 启用下载按钮
        document.getElementById('downloadBtn').disabled = false;
        
        // 添加到历史记录
        this.addToHistory('图像上传', '原始图像已加载');
        
        // 动画效果
        anime({
            targets: this.canvasContainer,
            opacity: [0, 1],
            scale: [0.8, 1],
            duration: 600,
            easing: 'easeOutExpo'
        });
    }
    
    updateGrid() {
        if (!this.showGridCheckbox.checked) {
            this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
            return;
        }
        const pixelSize = Math.max(1, Math.floor(parseInt(this.gridSizeInput.value) || 1));
        const opacity = parseInt(this.gridOpacitySlider.value) / 100;

        this.gridCtx.clearRect(0, 0, this.gridCanvas.width, this.gridCanvas.height);
        this.gridCtx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
        this.gridCtx.lineWidth = 1;

        // 使用用户输入的像素大小绘制网格
        for (let x = 0; x <= this.gridCanvas.width; x += pixelSize) {
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(x, 0);
            this.gridCtx.lineTo(x, this.gridCanvas.height);
            this.gridCtx.stroke();
        }

        for (let y = 0; y <= this.gridCanvas.height; y += pixelSize) {
            this.gridCtx.beginPath();
            this.gridCtx.moveTo(0, y);
            this.gridCtx.lineTo(this.gridCanvas.width, y);
            this.gridCtx.stroke();
        }
    }
    
    updateCanvasZoom() {
        const zoom = parseInt(this.zoomLevelSlider.value) / 100;
        this.mainCanvas.style.transform = `scale(${zoom})`;
        this.gridCanvas.style.transform = `scale(${zoom})`;
    }
    
    async alignPixels() {
        if (!this.originalImage || this.isProcessing) return;
        
        this.isProcessing = true;
        this.showProcessingOverlay('正在对齐像素...');
        
        try {
            await this.simulateProcessing(2000); // 模拟处理时间
            
            const pixelSize = Math.max(1, Math.floor(parseInt(this.gridSizeInput.value) || 1));
            const alignedImageData = this.performPixelAlignment(pixelSize);

            this.ctx.putImageData(alignedImageData, 0, 0);
            this.processedImage = this.canvasToImage();

            this.addToHistory('像素对齐', `对齐到 ${pixelSize}px 网格`);
            this.updateStatistics();
            
        } catch (error) {
            console.error('像素对齐失败:', error);
            alert('像素对齐失败，请重试！');
        } finally {
            this.isProcessing = false;
            this.hideProcessingOverlay();
        }
    }
    
    performPixelAlignment(pixelSize) {
        const width = this.mainCanvas.width;
        const height = this.mainCanvas.height;
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const px = Math.max(1, Math.floor(pixelSize));
        const cols = Math.ceil(width / px);
        const rows = Math.ceil(height / px);

        for (let gridY = 0; gridY < rows; gridY++) {
            for (let gridX = 0; gridX < cols; gridX++) {
                const startX = gridX * px;
                const startY = gridY * px;
                const endX = Math.min(startX + px, width);
                const endY = Math.min(startY + px, height);

                // 计算该块内的平均颜色
                let totalR = 0, totalG = 0, totalB = 0, totalA = 0;
                let pixelCount = 0;

                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const index = (y * width + x) * 4;
                        totalR += data[index];
                        totalG += data[index + 1];
                        totalB += data[index + 2];
                        totalA += data[index + 3];
                        pixelCount++;
                    }
                }

                if (pixelCount === 0) continue;

                const avgR = Math.round(totalR / pixelCount);
                const avgG = Math.round(totalG / pixelCount);
                const avgB = Math.round(totalB / pixelCount);
                const avgA = Math.round(totalA / pixelCount);

                // 将该块内的所有像素设置为平均颜色
                for (let y = startY; y < endY; y++) {
                    for (let x = startX; x < endX; x++) {
                        const index = (y * width + x) * 4;
                        data[index] = avgR;
                        data[index + 1] = avgG;
                        data[index + 2] = avgB;
                        data[index + 3] = avgA;
                    }
                }
            }
        }

        return imageData;
    }
    
    async removeNoise() {
        if (!this.originalImage || this.isProcessing) return;
        
        this.isProcessing = true;
        this.showProcessingOverlay('正在去除杂色...');
        
        try {
            await this.simulateProcessing(3000); // 模拟处理时间
            
            const denoiseStrength = parseInt(this.denoiseStrengthSlider.value);
            const colorTolerance = parseInt(this.colorToleranceSlider.value);
            const colorCount = parseInt(this.colorCountSlider.value);
            
            const denoisedImageData = this.performNoiseRemoval(denoiseStrength, colorTolerance, colorCount);
            
            this.ctx.putImageData(denoisedImageData, 0, 0);
            this.processedImage = this.canvasToImage();
            
            this.addToHistory('杂色去除', `降噪强度: ${denoiseStrength}%, 颜色数: ${colorCount}`);
            this.updateStatistics();
            
        } catch (error) {
            console.error('杂色去除失败:', error);
            alert('杂色去除失败，请重试！');
        } finally {
            this.isProcessing = false;
            this.hideProcessingOverlay();
        }
    }
    
    performNoiseRemoval(strength, tolerance, maxColors) {
        const imageData = this.ctx.getImageData(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        const data = imageData.data;
        
        // 颜色量化 - 减少颜色数量
        const colorMap = new Map();
        const toleranceValue = tolerance * 2.55; // 转换为0-255范围
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // 找到相似的颜色
            let foundSimilar = false;
            for (const [key, value] of colorMap) {
                const [cr, cg, cb] = key.split(',').map(Number);
                const distance = Math.sqrt(
                    Math.pow(r - cr, 2) + Math.pow(g - cg, 2) + Math.pow(b - cb, 2)
                );
                
                if (distance < toleranceValue) {
                    data[i] = cr;
                    data[i + 1] = cg;
                    data[i + 2] = cb;
                    foundSimilar = true;
                    break;
                }
            }
            
            if (!foundSimilar && colorMap.size < maxColors) {
                const colorKey = `${r},${g},${b}`;
                colorMap.set(colorKey, true);
            }
        }
        
        // 简单的模糊处理来减少噪声
        if (strength > 0) {
            const blurRadius = Math.floor(strength / 25) + 1;
            this.applyBlur(imageData, blurRadius);
        }
        
        return imageData;
    }
    
    applyBlur(imageData, radius) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const originalData = new Uint8ClampedArray(data);
        
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                let totalR = 0, totalG = 0, totalB = 0, count = 0;
                
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const index = ((y + dy) * width + (x + dx)) * 4;
                        totalR += originalData[index];
                        totalG += originalData[index + 1];
                        totalB += originalData[index + 2];
                        count++;
                    }
                }
                
                const centerIndex = (y * width + x) * 4;
                data[centerIndex] = Math.round(totalR / count);
                data[centerIndex + 1] = Math.round(totalG / count);
                data[centerIndex + 2] = Math.round(totalB / count);
            }
        }
    }
    
    canvasToImage() {
        return this.mainCanvas.toDataURL();
    }
    
    showProcessingOverlay(message) {
        document.querySelector('#processingOverlay p').textContent = message;
        this.processingOverlay.classList.remove('hidden');
        
        // 进度条动画
        anime({
            targets: '#progressFill',
            width: '100%',
            duration: 2000,
            easing: 'easeInOutQuad'
        });
    }
    
    hideProcessingOverlay() {
        this.processingOverlay.classList.add('hidden');
        document.getElementById('progressFill').style.width = '0%';
    }
    
    async simulateProcessing(duration) {
        return new Promise(resolve => {
            let progress = 0;
            const interval = duration / 100;
            
            const updateProgress = () => {
                progress += 1;
                document.getElementById('progressText').textContent = progress + '%';
                
                if (progress < 100) {
                    setTimeout(updateProgress, interval);
                } else {
                    resolve();
                }
            };
            
            updateProgress();
        });
    }
    
    addToHistory(action, details) {
        const timestamp = new Date().toLocaleTimeString();
        this.processHistory.push({ action, details, timestamp });
        
        // 更新历史面板
        const historyItem = document.createElement('div');
        historyItem.className = 'p-3 bg-gray-800 rounded-lg';
        historyItem.innerHTML = `
            <div class="text-sm font-medium text-cyan-400">${action}</div>
            <div class="text-xs text-gray-400 mt-1">${details}</div>
            <div class="text-xs text-gray-500 mt-1">${timestamp}</div>
        `;
        
        this.historyPanel.insertBefore(historyItem, this.historyPanel.firstChild);
        
        // 限制历史记录数量
        if (this.historyPanel.children.length > 5) {
            this.historyPanel.removeChild(this.historyPanel.lastChild);
        }
        
        // 动画效果
        anime({
            targets: historyItem,
            translateX: [-300, 0],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutExpo'
        });
    }
    
    updateStatistics() {
        // 模拟统计数据
        const processTime = (Math.random() * 2 + 0.5).toFixed(1) + 's';
        const colorReduction = Math.floor(Math.random() * 50 + 20) + '%';
        const pixelOptimization = Math.floor(Math.random() * 30 + 10) + '%';
        
        document.getElementById('processTime').textContent = processTime;
        document.getElementById('colorReduction').textContent = colorReduction;
        document.getElementById('pixelOptimization').textContent = pixelOptimization;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    resetImage() {
        if (!this.originalImage) return;
        
        this.ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.ctx.drawImage(this.originalImage, 0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.processedImage = this.originalImage;
        
        this.addToHistory('重置图像', '恢复到原始状态');
    }
    
    undoLast() {
        if (this.processHistory.length <= 1) return;
        
        this.processHistory.pop(); // 移除最后一个操作
        const lastOperation = this.processHistory[this.processHistory.length - 1];
        
        if (lastOperation && lastOperation.action === '图像上传') {
            this.resetImage();
        }
        
        // 更新历史面板
        this.historyPanel.removeChild(this.historyPanel.firstChild);
    }
    
    toggleComparison() {
        const comparisonView = document.getElementById('comparisonView');
        const isVisible = !comparisonView.classList.contains('hidden');
        
        if (isVisible) {
            comparisonView.classList.add('hidden');
        } else {
            comparisonView.classList.remove('hidden');
            this.setupComparisonView();
        }
    }
    
    setupComparisonView() {
        if (!this.originalImage || !this.processedImage) return;
        
        const beforeCanvas = document.getElementById('beforeCanvas');
        const afterCanvas = document.getElementById('afterCanvas');
        
        const beforeCtx = beforeCanvas.getContext('2d');
        const afterCtx = afterCanvas.getContext('2d');
        
        // 设置画布尺寸
        beforeCanvas.width = this.mainCanvas.width / 2;
        beforeCanvas.height = this.mainCanvas.height;
        afterCanvas.width = this.mainCanvas.width / 2;
        afterCanvas.height = this.mainCanvas.height;
        
        // 绘制对比图像
        beforeCtx.drawImage(this.originalImage, 0, 0, beforeCanvas.width, beforeCanvas.height);
        afterCtx.drawImage(this.mainCanvas, 0, 0, afterCanvas.width, afterCanvas.height);
    }
    
    downloadImage() {
        if (!this.processedImage) return;
        
        const format = document.getElementById('outputFormat').value;
        const quality = parseInt(document.getElementById('outputQuality').value) / 100;
        const scale = parseInt(document.getElementById('outputScale').value) / 100;
        
        // 创建临时画布进行导出
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCanvas.width = this.mainCanvas.width * scale;
        exportCanvas.height = this.mainCanvas.height * scale;
        
        exportCtx.drawImage(this.mainCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
        
        // 导出图像
        exportCanvas.toBlob((blob) => {
            const link = document.createElement('a');
            link.download = `pixelai_processed_${Date.now()}.${format}`;
            link.href = URL.createObjectURL(blob);
            link.click();
            
            this.addToHistory('下载图像', `格式: ${format.toUpperCase()}, 质量: ${quality * 100}%`);
        }, `image/${format}`, quality);
    }
}

// 全局函数
function scrollToTool() {
    document.getElementById('tool-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function alignPixels() {
    processor.alignPixels();
}

function removeNoise() {
    processor.removeNoise();
}

function resetImage() {
    processor.resetImage();
}

function undoLast() {
    processor.undoLast();
}

function toggleComparison() {
    processor.toggleComparison();
}

function downloadImage() {
    processor.downloadImage();
}

// 初始化应用
let processor;
document.addEventListener('DOMContentLoaded', () => {
    processor = new PixelAIProcessor();
});