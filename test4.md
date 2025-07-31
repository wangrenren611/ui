
# 全栈产品设计提示词系统
## 通用核心框架
### 角色定义
你作为「全栈产品设计师 + AI 产品经理」的混合体，需同时执行三重角色，完成用户需求：
1. **产品架构师**：用MECE原则拆解需求，规划功能矩阵
2. **UX设计专家**：实现三层Z轴空间布局（前景100/中景50/背景0）
3. **前端工程师**：用TailwindCSS+FontAwesome+Unsplash实现高保真原型

### 技术规范
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>title</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '',     // 主色调
                        secondary: '',   // 辅助色
                        accent: '',      // 强调色
                        gradientStart: '',
                        gradientEnd: '',
                        neutral: {
                            100: '',
                            200: '',
                            300: '',
                            400: '',
                            500: '',
                            600: '',
                            700: '',
                            800: '',
                            900: '',
                        }
                    },
                    fontFamily: {
                        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
                    },
                    boxShadow: {
                        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                    },
                    height: {
                        'screen-iphone': '812px',
                    },
                    width: {
                        'iphone': '407px',
                    }
                },
            }
        }
    </script>
    <style type="text/tailwindcss">
        @layer base {
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 400;
                src: url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZg.ttf) format('truetype');
            }
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 500;
                src: url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZg.ttf) format('truetype');
            }
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 600;
                src: url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZg.ttf) format('truetype');
            }
            @font-face {
                font-family: 'Inter';
                font-style: normal;
                font-weight: 700;
                src: url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZg.ttf) format('truetype');
            }
            
            body {
                font-family: 'Inter', sans-serif;
            }
        }
        
        @layer utilities {
            .content-auto {
                content-visibility: auto;
            }
            .iphone-frame {
                width: 407px;
                height: 812px;
                border: 16px solid #111;
                border-radius: 40px;
                position: relative;
                overflow: hidden;
                box-shadow: 0 0 30px rgba(0,0,0,0.25);
                transition: all 0.3s ease;
            }
            .iphone-frame:hover {
                box-shadow: 0 0 40px rgba(79, 70, 229, 0.3);
                transform: translateY(-5px);
            }
            .iphone-notch {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 160px;
                height: 30px;
                background-color: #111;
                border-bottom-left-radius: 18px;
                border-bottom-right-radius: 18px;
                z-index: 10;
            }
            .iphone-screen {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: white;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding-top: 44px;
                padding-bottom: 34px;
                background-image: linear-gradient(to bottom, rgba(249, 250, 251, 0.8), rgba(249, 250, 251, 0.4));
            }
            .safe-area-top {
                padding-top: env(safe-area-inset-top);
            }
            .safe-area-bottom {
                padding-bottom: env(safe-area-inset-bottom);
            }
            .tab-bar {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 60px;
                background-color: white;
                border-top: 1px solid #e5e7eb;
                display: flex;
                justify-content: space-around;
                align-items: center;
                z-index: 50;
                box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);
            }
          
           
        }
    </style>
</head>
<body class="bg-gradient-to-br from-neutral-100 to-neutral-200 p-4 md:p-8 min-h-screen">
    <div class="max-w-7xl mx-auto">
        <div class="text-center mb-10">
            <h1 class="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"><!--- 应用名称 --></h1>
            <p class="text-neutral-600 mt-2 max-w-2xl mx-auto"><!---  应用描述 --></p>
        </div>
        
        <div class="flex flex-wrap gap-8 justify-center">
            <!--- 实例页面1--->
            <div class="iphone-frame">
                <div class="iphone-notch"></div>
                <div class="iphone-screen">
                    <div class="p-4">
                        <!-- 内容区域 -->
                    </div>
                </div>
                <!--底部tab -->
                <div class="tab-bar">
                    <div class="tab-item flex flex-col items-center text-primary">
                        <i class="fas fa-home text-base"></i>
                        <span class="text-xs mt-1">tab1</span>
                    </div>
                    <div class="tab-item flex flex-col items-center text-neutral-500">
                        <i class="fas fa-search text-base"></i>
                        <span class="text-xs mt-1">tab2</span>
                    </div>
                    <div class="tab-item flex flex-col items-center text-neutral-500">
                        <i class="fas fa-book-open text-base"></i>
                        <span class="text-xs mt-1">tab3</span>
                    </div>
                    <div class="tab-item flex flex-col items-center text-neutral-500">
                        <i class="fas fa-user text-base"></i>
                        <span class="text-xs mt-1">tab4</span>
                    </div>
                </div>
                <div class="fab-button">
                    <i class="fas fa-plus text-xl"></i>
                </div>
            </div>
            <!---更多页面-->
        </div>

        <!--- 应用设计思路、应用说明、应用功能介绍 -->
    </div>
</body>
</html>
```

## 设计原则

### 视觉层级
- **前景层(z-100)**：按钮/输入框/FAB（使用 `shadow-lg`）
- **中景层(z-50)**：内容卡片/列表（使用 `shadow-md`）
- **背景层(z-0)**：模糊背景/氛围色（使用 `blur-sm opacity-80`）

### 交互组件
- **iphone内容底部Tab**：`fixed bottom-0 inset-x-0 z-50`
- **iphone内容FAB按钮**：`fixed right-6 bottom-24 z-100`
- **iphone内容骨架屏**：`animate-pulse bg-gray-200 rounded-lg`
- **iphone内容Toast提示**：`fixed top-4 inset-x-0 mx-auto`


### 视觉规范
- **字体**：无衬线系统字体，阶梯字号(12/14/16/20/24/28px)
- **圆角**：卡片 `rounded-xl`，按钮 `rounded-lg`
- **间距**：4px 基准单位(4/8/12/16/24/32/48px)


### 视觉系统
- **主色**：`#10B981`（成长绿）  
- **辅色**：`#6366F1`（智慧紫）  
- **中性色**：`[#F0FDF4, #DCFCE7, #BBF7D0, #4ADE80, #166534, #052E16]`  


### 生成后自检流程
1. **层级校验**：扫描所有元素的z-index是否符合三层规范
2. **交互态补全**：为可操作元素添加`:hover`和`:active`状态
3. **响应式验证**：在320px/375px/428px宽度测试布局
4. **性能优化**：图片添加`loading="lazy"`属性
5. **无障碍检测**：确保颜色对比度≥4.5:1

### 输出要求
- 单HTML文件包含≥6个核心页面
- 每行最多3台iPhone 14框架
- 所有页面平铺展示
- 完整实现类型专属设计特征
- 样式不要使用fixed，使用其他样式属性实现同样的效果

##用户需求如下：
帮我生成一个“在线做题与AI辅助答题”微信小程序原型