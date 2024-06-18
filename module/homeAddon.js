ModuleCache.homeAddon = {
    logoclick: {
        init: () => {
            let click = 0;
            document.getElementById("logo").addEventListener("click", () => {
                click++;
                if (click >= 5) {
                    function getVideoCardInfo() {
                        const gl = document.createElement('canvas').getContext('webgl');
                        if (!gl) {
                            return false;
                        }
                        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                        return debugInfo ? {
                            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                        } : false;
                    }
                    let GPUinfo = getVideoCardInfo();
                    if (GPUinfo) {
                        let GPUname = GPUinfo.renderer;
                        if (GPUinfo.renderer.indexOf("ANGLE") == 0) {
                            GPUname = GPUname.substring(GPUname.indexOf(",") + 2, GPUname.indexOf("Direct3D") - 1);
                        }
                        document.getElementById("logo").src = "/static/icon/gpu.webp";
                        document.getElementById("logo").alt = "显卡信息";
                        document.getElementById("title").innerText = GPUname;
                    }
                }
            });
            document.getElementById("logo").addEventListener("contextmenu", async (event) => {
                event.preventDefault();
                document.getElementById("title").innerText = "更新导航数据...";
                await Module.naviRender.updateAndRender();
                document.getElementById("title").innerText = "导航数据更新成功";
            });
        }
    },
    //最近使用
    recent: {
        init: () => {
            Module.recent.render();
        },
        render: () => {
            document.querySelector(".bottom").innerHTML = "";
            let recent = Module.pref.get("recent") || [];
            if (recent.length) {
                recent.forEach((item, index) => {
                    const list = document.createElement("a");
                    list.className = "recentItem";
                    list.innerHTML = (item.icon ? `<img class="recentItemIcon" src="${item.icon}" alt="${item.name}">` : "") + `<span class="recentItemTitle">${item.name}</span>`;
                    list.href = item.url;
                    item.url.startsWith("http") ? list.target = "_blank" : false;
                    document.querySelector(".bottom").appendChild(list);
                });
            } else {
                const text = document.createElement("span");
                text.className = "recentText";
                text.innerText = "最近使用过的内容会出现在这里捏";
                document.querySelector(".bottom").appendChild(text);
            }
        }
    }
}