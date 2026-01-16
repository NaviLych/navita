# 电子吧唧生成器 (Badge Generator)

一个用于创建和下载自定义电子吧唧的 Web 应用，支持导出为苹果 Live Photo 格式。

## 功能特性

- 🎨 自定义吧唧样式（渐变、纯色、玻璃、霓虹）
- 🔲 多种形状选择（圆角、圆形、方形）
- ✨ 特效支持（闪光、浮动动画、发光）
- 📷 图片上传和预览
- 💾 **Live Photo 格式下载**

## Live Photo 下载功能

点击"下载吧唧"按钮会生成两个文件：

1. **badge-photo-[timestamp].jpg** - 静态图片（高分辨率 JPEG）
2. **badge-video-[timestamp].webm** 或 **.mp4** - 动画视频（3秒循环，格式取决于浏览器支持）

这两个文件可以组合使用，模拟苹果 Live Photo 效果。

### 如何在 iPhone 上使用

1. 将下载的两个文件传输到您的 iPhone
2. 使用支持 Live Photo 的第三方应用（如 intoLive 等）将静态图片和视频组合成真正的 Live Photo
3. 保存到相册即可

### 技术实现

- **静态图片**：使用 SVG foreignObject 和 Canvas API 生成高质量 JPEG
- **动画视频**：使用 MediaRecorder API 录制 3 秒的动画视频
- **浏览器兼容性**：需要现代浏览器支持（Chrome 49+、Firefox 25+、Safari 14+）

## 浏览器要求

- Chrome 49+ (推荐)
- Firefox 25+
- Safari 14+
- Edge 79+

## 使用说明

1. 打开 `index.html`
2. 上传图片或使用默认占位符
3. 自定义标题、副标题
4. 选择样式和特效
5. 点击"下载吧唧"生成 Live Photo 文件

## 注意事项

- 下载功能使用原生浏览器 API，无需外部依赖
- 视频格式为 WebM 或 MP4（取决于浏览器支持）
- 某些浏览器可能需要用户授权下载多个文件
- 生成过程可能需要几秒钟，请耐心等待
