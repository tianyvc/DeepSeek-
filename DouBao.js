// ==UserScript==
// @name         豆包网页美化
// @namespace    http://tampermonkey.net/
// @version      11.3.0
// @description  单层气泡无多余磨砂，用户气泡低饱和蓝色，AI气泡浅色磨砂，移除新对话问候文字滑动黑块动画
// @author       You
// @match        *://*.doubao.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        bgApiUrl: 'https://t.alcy.cc/pc',
        bgBlur: 8,
        bgBrightness: 0.55,
        aiCardOpacity: 0.82,
        userBubbleOpacity: 0.88,
        radius: 18,
        pollInterval: 800
    };

    let objectUrl = null;
    let observer = null;

    async function fetchRandomBgAsObjectUrl() {
        try {
            const resp = await fetch(CONFIG.bgApiUrl, {
                method: 'GET',
                redirect: 'follow',
                cache: 'no-store'
            });

            if (!resp.ok) throw new Error('bg fetch failed');

            const blob = await resp.blob();
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }

            objectUrl = URL.createObjectURL(blob);
            return objectUrl;
        } catch (e) {
            console.warn('[豆包美化] 在线壁纸加载失败，使用兜底图', e);
            return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80';
        }
    }

    function injectBaseStyle() {
        const style = document.createElement('style');
        style.id = 'doubao-fix-style-final';
        style.textContent = `
/* ========== 底层背景 ========== */
#doubao-custom-bg {
    position: fixed;
    inset: 0;
    z-index: -99999 !important;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    filter: blur(${CONFIG.bgBlur}px) brightness(${CONFIG.bgBrightness});
    transform: scale(1.05);
    pointer-events: none;
}

/* ========== 根容器透明 ========== */
html,
body,
#root,
#root > div,
#root > div > div,
#root > div > div > div,
div[role="main"],
main,
div[class*="layout"],
div[class*="welcome"],
div[class*="empty-chat"],
div[class*="home-page"],
div[class*="starter"]
{
    background: transparent !important;
    background-color: transparent !important;
}

/* ========== 顶部导航修复 ========== */
header,
[class*="topbar"],
[class*="header"],
div[data-testid*="header"],
div[class*="nav-bar"],
#root > div > div > header,
div[role="banner"] {
    background-color: transparent !important;
    background: transparent !important;
}

/* ========== 侧边栏透明 ========== */
aside,
[class*="sidebar"],
[class*="Sidebar"],
div[data-testid*="sidebar"] {
    background-color: transparent !important;
    background: transparent !important;
    border-color: rgba(255,255,255,0.06) !important;
}
aside li,
aside [class*="item"],
aside [data-testid="conversation-item"] {
    background-color: transparent !important;
}

/* ========== 消息列表/滚动容器透明 ========== */
div[data-testid="message-container"],
div[data-testid="message-list"],
[class*="message-list"],
[class*="scroll-container"],
div[role="feed"] {
    background: transparent !important;
    background-color: transparent !important;
}

/* ========== 输入区透明 ========== */
footer,
[class*="composer"],
[class*="input-area"],
div[data-testid="composer"] {
    background: transparent !important;
}
div[role="textbox"],
[contenteditable="true"] {
    background-color: rgba(255,255,255,0.78) !important;
    border-radius: 16px !important;
    padding: 14px 16px !important;
}
html[data-theme="dark"] div[role="textbox"],
html[data-theme="dark"] [contenteditable="true"] {
    background-color: rgba(24,28,36,0.88) !important;
}

/* ========== 用户消息外层：彻底去掉磨砂和多余背景 ========== */
[data-testid="send_message"],
[data-testid="send_message"] > div,
[data-testid="send_message"] > div > div {
    background: transparent !important;
    background-color: transparent !important;
    background-image: none !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
    border: none !important;
}

/* ========== 用户气泡：低饱和蓝色（单层） ========== */
.doubao-user-single-bubble {
    background: rgba(72, 130, 205, ${CONFIG.userBubbleOpacity}) !important;
    border-radius: ${CONFIG.radius}px !important;
    padding: 14px 18px !important;
    color: #fff !important;
    backdrop-filter: blur(14px) saturate(130%) !important;
    -webkit-backdrop-filter: blur(14px) saturate(130%) !important;
    box-shadow: 0 6px 18px rgba(72, 130, 205, 0.35) !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    display: inline-block !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
}

.doubao-user-single-bubble > * {
    background-color: transparent !important;
    background: transparent !important;
}

/* ========== AI 消息外层透明 ========== */
[data-testid="receive_message"],
[data-testid="receive_message"] > div,
[data-testid="receive_message"] > div > div {
    background: transparent !important;
    background-color: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
}

/* ========== AI 气泡：浅色磨砂单层卡片 ========== */
.doubao-ai-single-bubble {
    background-color: rgba(255,255,255,${CONFIG.aiCardOpacity}) !important;
    border-radius: ${CONFIG.radius}px !important;
    padding: 18px 20px !important;
    backdrop-filter: blur(18px) saturate(140%) !important;
    -webkit-backdrop-filter: blur(18px) saturate(140%) !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.22) !important;
    border: 1px solid rgba(255,255,255,0.35) !important;
    display: inline-block !important;
    max-width: 100% !important;
}
html[data-theme="dark"] .doubao-ai-single-bubble {
    background-color: rgba(24,28,36,${CONFIG.aiCardOpacity}) !important;
    border: 1px solid rgba(255,255,255,0.10) !important;
}
.doubao-ai-single-bubble > * {
    background-color: transparent !important;
    background: transparent !important;
}

/* ========== 代码块 ========== */
pre {
    background-color: rgba(15,17,22,0.86) !important;
    color: #f0f2f5 !important;
    border-radius: 12px !important;
    padding: 16px !important;
    overflow: auto;
}
pre code {
    background: transparent !important;
    padding: 0 !important;
}
code:not(pre code) {
    background: rgba(0,0,0,0.08) !important;
    color: #d6336c !important;
    padding: 2px 6px !important;
    border-radius: 6px !important;
}
html[data-theme="dark"] code:not(pre code) {
    background: rgba(255,255,255,0.12) !important;
    color: #ff79a7 !important;
}

/* ========== 骨架屏黑块修复 ========== */
[class*="skeleton"],
[class*="skeleton-item"] {
    background: rgba(40,44,52,0.4) !important;
    background-color: rgba(40,44,52,0.4) !important;
}

/* ========== 滚动条 ========== */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.08) !important;
}
::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.25) !important;
    border-radius: 4px;
}

/* ========== 【重点】移除问候文字黑色滑动遮罩伪元素，删除动画 ========== */
.greeting-text-Q0pGud::after {
    display: none !important;
    content: none !important;
}
[class*="greeting-text"]::after {
    display: none !important;
    content: none !important;
}
        `;
        document.head.appendChild(style);

        if (!document.querySelector('#doubao-custom-bg')) {
            const bgDom = document.createElement('div');
            bgDom.id = 'doubao-custom-bg';
            document.documentElement.appendChild(bgDom);
        }
    }

    function clearAllBg(root) {
        if (!root || !root.style) return;
        root.style.backgroundColor = '';
        root.style.background = '';
        root.style.backgroundImage = 'none';
        root.style.backdropFilter = 'none';
        root.style.webkitBackdropFilter = 'none';
        if (root.children && root.children.length) {
            for (let i = 0; i < root.children.length; i++) {
                clearAllBg(root.children[i]);
            }
        }
    }

    function applyUserSingleBubble() {
        document.querySelectorAll('[data-testid="send_message"]').forEach(item => {
            clearAllBg(item);
            if (item.children && item.children.length) {
                clearAllBg(item.children[0]);
            }
            const inner = item.querySelector('div');
            if (inner) {
                inner.classList.add('doubao-user-single-bubble');
                clearAllBg(inner);
            }
        });
    }

    function applyAISingleBubble() {
        document.querySelectorAll('[data-testid="receive_message"]').forEach(item => {
            clearAllBg(item);
            if (item.children && item.children.length) {
                clearAllBg(item.children[0]);
            }
            const inner = item.querySelector('div');
            if (inner) {
                inner.classList.add('doubao-ai-single-bubble');
                clearAllBg(inner);
            }
        });
    }

    function clearKeyDarkContainers() {
        const nodes = document.querySelectorAll(
            'header, aside, div[data-testid*="header"], div[data-testid*="sidebar"], div[data-testid="message-list"], div[data-testid="message-container"], div[class*="welcome"], div[class*="empty-chat"], div[class*="home-page"]'
        );
        nodes.forEach(el => clearAllBg(el));
    }

    function runFix() {
        applyUserSingleBubble();
        applyAISingleBubble();
        clearKeyDarkContainers();
    }

    function startObserver() {
        if (observer) return;
        observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                if (m.addedNodes.length) {
                    requestAnimationFrame(runFix);
                }
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function startFixLoop() {
        setInterval(runFix, CONFIG.pollInterval);
    }

    async function run() {
        injectBaseStyle();
        startObserver();
        startFixLoop();
        runFix();

        const bgUrl = await fetchRandomBgAsObjectUrl();
        const bgDom = document.querySelector('#doubao-custom-bg');
        if (bgDom) {
            bgDom.style.backgroundImage = `url("${bgUrl}")`;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
        run();
    }
})();
