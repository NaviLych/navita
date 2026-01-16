// Simple image cropper
class ImageCropper {
    constructor() {
        this.modal = null;
        this.canvas = null;
        this.ctx = null;
        this.image = null;
        this.cropArea = {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.onCropComplete = null;
        this.scale = 1;
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'cropper-modal';
        this.modal.innerHTML = `
            <div class="cropper-container">
                <div class="cropper-header">
                    <h3>裁剪图片</h3>
                    <button class="cropper-close" title="关闭">✕</button>
                </div>
                <div class="cropper-canvas-wrapper">
                    <canvas class="cropper-canvas"></canvas>
                </div>
                <div class="cropper-controls">
                    <button class="btn btn-secondary cropper-cancel">取消</button>
                    <button class="btn btn-primary cropper-confirm">确认裁剪</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);

        this.canvas = this.modal.querySelector('.cropper-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Event listeners
        this.modal.querySelector('.cropper-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.cropper-cancel').addEventListener('click', () => this.close());
        this.modal.querySelector('.cropper-confirm').addEventListener('click', () => this.confirm());

        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleMouseUp());
    }

    async open(imageData) {
        if (!this.modal) {
            this.createModal();
        }

        this.image = new Image();
        
        return new Promise((resolve) => {
            this.image.onload = () => {
                this.setupCanvas();
                this.modal.classList.add('active');
                this.onCropComplete = resolve;
            };
            this.image.src = imageData;
        });
    }

    setupCanvas() {
        const maxWidth = Math.min(800, window.innerWidth - 100);
        const maxHeight = Math.min(600, window.innerHeight - 250);
        
        let canvasWidth = this.image.width;
        let canvasHeight = this.image.height;
        
        // Scale down if too large
        if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
            const scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
            canvasWidth = canvasWidth * scale;
            canvasHeight = canvasHeight * scale;
            this.scale = scale;
        }

        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;

        // Initialize crop area to center square
        const size = Math.min(canvasWidth, canvasHeight) * 0.8;
        this.cropArea = {
            x: (canvasWidth - size) / 2,
            y: (canvasHeight - size) / 2,
            width: size,
            height: size
        };

        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw image
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);

        // Draw dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Clear crop area
        this.ctx.clearRect(
            this.cropArea.x,
            this.cropArea.y,
            this.cropArea.width,
            this.cropArea.height
        );

        // Redraw image in crop area
        this.ctx.drawImage(
            this.image,
            this.cropArea.x,
            this.cropArea.y,
            this.cropArea.width,
            this.cropArea.height
        );

        // Draw crop border
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            this.cropArea.x,
            this.cropArea.y,
            this.cropArea.width,
            this.cropArea.height
        );

        // Draw corner handles
        const handleSize = 12;
        this.ctx.fillStyle = '#667eea';
        const corners = [
            [this.cropArea.x, this.cropArea.y],
            [this.cropArea.x + this.cropArea.width, this.cropArea.y],
            [this.cropArea.x, this.cropArea.y + this.cropArea.height],
            [this.cropArea.x + this.cropArea.width, this.cropArea.y + this.cropArea.height]
        ];

        corners.forEach(([x, y]) => {
            this.ctx.fillRect(
                x - handleSize / 2,
                y - handleSize / 2,
                handleSize,
                handleSize
            );
        });
    }

    getCanvasPoint(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    isInsideCropArea(x, y) {
        return x >= this.cropArea.x &&
               x <= this.cropArea.x + this.cropArea.width &&
               y >= this.cropArea.y &&
               y <= this.cropArea.y + this.cropArea.height;
    }

    handleMouseDown(e) {
        const point = this.getCanvasPoint(e.clientX, e.clientY);
        
        if (this.isInsideCropArea(point.x, point.y)) {
            this.isDragging = true;
            this.dragStart = {
                x: point.x - this.cropArea.x,
                y: point.y - this.cropArea.y
            };
            this.canvas.style.cursor = 'move';
        }
    }

    handleMouseMove(e) {
        const point = this.getCanvasPoint(e.clientX, e.clientY);

        if (this.isDragging) {
            // Update crop area position
            let newX = point.x - this.dragStart.x;
            let newY = point.y - this.dragStart.y;

            // Constrain to canvas
            newX = Math.max(0, Math.min(newX, this.canvas.width - this.cropArea.width));
            newY = Math.max(0, Math.min(newY, this.canvas.height - this.cropArea.height));

            this.cropArea.x = newX;
            this.cropArea.y = newY;

            this.draw();
        } else {
            // Update cursor
            if (this.isInsideCropArea(point.x, point.y)) {
                this.canvas.style.cursor = 'move';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    async confirm() {
        // Calculate original image coordinates
        const scaleX = this.image.width / this.canvas.width;
        const scaleY = this.image.height / this.canvas.height;

        const cropX = this.cropArea.x * scaleX;
        const cropY = this.cropArea.y * scaleY;
        const cropWidth = this.cropArea.width * scaleX;
        const cropHeight = this.cropArea.height * scaleY;

        // Create a new canvas for cropped image
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;
        const croppedCtx = croppedCanvas.getContext('2d');

        // Draw cropped image
        croppedCtx.drawImage(
            this.image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
        );

        // Convert to data URL
        const croppedImageData = croppedCanvas.toDataURL('image/png');

        this.close();

        if (this.onCropComplete) {
            this.onCropComplete(croppedImageData);
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
            if (this.onCropComplete) {
                this.onCropComplete(null);
            }
        }
    }

    destroy() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

// Export singleton instance
const imageCropper = new ImageCropper();
