const util = {
    sleep: delay => new Promise((resolve) => setTimeout(resolve, delay)),
    random: (min, max) => {
        return Math.round(Math.random() * (max - min)) + min;
    },
    loadScriptAsync: link => {
        return new Promise(resolve => {
            let script = document.createElement("script");
            script.src = link;
            script.onload = resolve;
            document.body.appendChild(script);
        });
    },
    link: (url, external) => {
        if (external) {
            window.open(url, "_blank");
        } else {
            location.href = url;
        }
    },
    loadCssCode: (code) => {
        var style = document.createElement('style')
        style.type = 'text/css'
        style.rel = 'stylesheet'
        style.appendChild(document.createTextNode(code))
        var head = document.getElementsByTagName('head')[0]
        head.appendChild(style)
    },
    setInnerHTML: (elm, html) => {
        elm.innerHTML = html;
        Array.from(elm.querySelectorAll("script"))
            .forEach(oldScriptEl => {
                const newScriptEl = document.createElement("script");

                Array.from(oldScriptEl.attributes).forEach(attr => {
                    newScriptEl.setAttribute(attr.name, attr.value)
                });

                const scriptText = document.createTextNode(oldScriptEl.innerHTML);
                newScriptEl.appendChild(scriptText);

                oldScriptEl.parentNode.replaceChild(newScriptEl, oldScriptEl);
            });
    }
}
let ModuleCache = {};
window.ModuleLoader = {
    useRedbankLoaderGlobal: true,
    pendingCalls: [],
    loadedRemote: [],
    checkPending: async () => {
        for (const call of ModuleLoader.pendingCalls) {
            if (Module[call.name]) {
                await call.callback();
            }
        }
    },
    loadLocal: async (part, initList) => {
        Module = Object.assign(Module, part);
        await Module.autoinit.initList(initList ? initList : Object.keys(part));
        await ModuleLoader.checkPending();
    },
    loadRemote: async (name, initList) => {
        //加载远程模块
        await util.loadScriptAsync("module/" + name + ".js");
        await ModuleLoader.loadLocal(ModuleCache[name], initList);
        delete ModuleCache[name];
        ModuleLoader.loadedRemote.push(name);
    },
    queueLoaded: async (name, callback) => {
        //确定已经置入队列加载的模块
        //调用前请确保已调用模块加载器
        if (Module[name]) {
            return await callback();
        } else {
            ModuleLoader.pendingCalls.append({ name: name, callback: callback });
            //-10表示模块尚未就绪，就绪后会自动调用
            //模块就绪时间不定，可能需要覆盖和取消的操作不要用这个
            return -10;
        }

    },
    ensureLoaded: async (name, modulename, callback) => {
        //不确定是否调用模块加载器的情况
        //确保模块加载完成执行后再回调
        if (Module[name]) {
            return await callback();
        } else {
            //高优先级加载
            if (ModuleLoader.loadedRemote.includes(modulename)) {
                //已经加载过指定模块，但模块内没有这个组件
                return -1;
            } else {
                await ModuleLoader.loadRemote(modulename);
                if (Module[name]) {
                    return await callback();
                }
                //加载了，但并没有这个组件
                return -1;
            }
        }
    }
}
let Module = {
    autoinit: {
        initEverything: async () => {
            Module.autoinit.initList(Object.keys(Module));
        },
        initList: async (list) => {
            for (const key of list) {
                if (Module[key].init && !Module[key].loaded) {
                    console.log("Module " + key + " init;");
                    await Module[key].init();
                    Module[key].loaded = true;
                }
            }
        }
    },
    netTick: {
        tick: 0,
        wait: async () => {
            await util.sleep(Math.pow(2, Module.netTick.tick) * 1000);
            Module.netTick.tick++;
        },
        reset: () => {
            Module.netTick.tick = 0;
        }
    },
    logger: {
        collect: (error) => {
            console.warn(error.message);
        }
    },
    pref: {
        init: () => {
            if (localStorage.pref) {
                Module.pref.data = JSON.parse(localStorage.pref);
            } else {
                Module.pref.sync();
            }
        },
        data: {},
        sync: () => {
            localStorage.pref = JSON.stringify(Module.pref.data);
        },
        get: (key) => {
            return Module.pref.data[key] || false;
        },
        set: (key, value) => {
            Module.pref.data[key] = value;
            Module.pref.sync();
        },
        addRecent: (icon, name, url) => {
            let recent = Module.pref.get("recent") || [];
            recent.unshift({ icon: icon, name: name, url: url });
            recent = recent.filter((value, index, self) =>
                index === self.findIndex((t) => (
                    t.place === value.place && t.name === value.name
                ))
            )
            recent = recent.slice(0, 50);
            Module.pref.set("recent", recent);
            Module.recent.render();
        }
    },
    pwa: {
        init: () => {
            if (navigator.serviceWorker && !navigator.serviceWorker.controller) {
                navigator.serviceWorker.register('sw.js');
            }
        }

    },
    naviUpdater: {
        init: () => {
            if ((Module.pref.get("lastNaviUpdate") == new Date().toLocaleDateString()) && localStorage.naviCache) { } else {
                Module.naviUpdater.update();
            };
        },
        getData: async () => {
            if (!localStorage.naviCache) {
                await Module.naviUpdater.update();
            };
            return JSON.parse(localStorage.naviCache);
        },
        update: async () => {
            let jsonText = "";
            try {
                jsonText = await (await fetch("navigate.json?ForceNoCache=1")).json();
            } catch (e) {
                Module.logger.collect(e);
                await Module.netTick.wait();
                return await Module.naviUpdater.update();
            };
            Module.netTick.reset();
            try {
                //自动Minify
                localStorage.naviCache = JSON.stringify(jsonText);
                Module.pref.set("lastNaviUpdate", new Date().toLocaleDateString())
            } catch (e) {
                Module.logger.collect(e);
            }
        }
    },
    yuni: {
        lazyinit: () => {
            util.loadCssCode(`#yuniFrame {
max-width: 600px;
margin: auto;
padding: 100%;
width: 100%;
height: calc(100% - 32px);
}

#closeBtn {
width: 100vw;
height: 32px;
border-radius: 10px 10px 0px 0px;
transition: background-color 0.2s, transform 0.3s ease-in-out;
}

#closeBtn:hover {
background-color: #cccccc;
}

#closeBtn:active {
background-color: #999999
}

#closeBtn.active {
background-color: #FADCBB
}

#yuniContainer {
transition: opacity 0.2s ease-in;
opacity: 0;
display: none;
z-index: 9999;
top: 0px;
bottom: 0px;
left: 0px;
right: 0px;
height: auto;
width: auto;
position: fixed;
background-color: rgba(0, 0, 0, 0.15);
}

#yuni {
display: flex;
flex-direction: column;
text-align: center;
width: 100vw;
height: 90vh;
border-radius: 10px 10px 0px 0px;
backdrop-filter: blur(10px) brightness(100%);
-webkit-backdrop-filter: blur(10px) brightness(100%);
background-color: rgba(255, 255, 255, 0.75);
margin-top: 100vh;
margin-bottom: 0px;
margin-left: 0px;
margin-right: 0px;
transition: margin-top 0.5s ease-out;
}

#loading {
width: 32px;
position: absolute;
margin: auto;
top: 0px;
bottom: 0px;
left: 0px;
right: 0px;
}`);
            const framediv = `<div id="yuniContainer">
<div id="yuni"> 
<img role="button" aria-label="关闭弹出页面" id="closeBtn" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik02IDlMNDIgOSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik02IDE5TDQyIDE5IiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTYgMjZMMjQgNDBMNDIgMjYiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=">
<iframe title="弹出页面" id="yuniFrame" frameborder="0"></iframe>
<img alt="加载中" id="loading" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjxzdmcgd2lkdGg9JzEyMHB4JyBoZWlnaHQ9JzEyMHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCI+DQogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9Im5vbmUiIGNsYXNzPSJiayI+PC9yZWN0Pg0KICAgIDxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjQwIiBzdHJva2U9IiNEQ0FDODkiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJidXR0Ij4NCiAgICAgICAgPGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ic3Ryb2tlLWRhc2hvZmZzZXQiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiBmcm9tPSIwIiB0bz0iNTAyIj48L2FuaW1hdGU+DQogICAgICAgIDxhbmltYXRlIGF0dHJpYnV0ZU5hbWU9InN0cm9rZS1kYXNoYXJyYXkiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIiB2YWx1ZXM9IjE1MC42IDEwMC40OzEgMjUwOzE1MC42IDEwMC40Ij48L2FuaW1hdGU+DQogICAgPC9jaXJjbGU+DQo8L3N2Zz4=">
</div>
</div>`
            document.body.insertAdjacentHTML('beforeend', framediv);
            //弹出
            const rebuildFrame = url => {
                if (document.getElementById("yuniFrame")) {
                    document.getElementById("yuni").removeChild(document.getElementById("yuniFrame"));
                };
                let newFrame = document.createElement("iframe");
                newFrame.id = "yuniFrame";
                newFrame.frameBorder = 0;
                document.getElementById("closeBtn").insertAdjacentElement("afterend", newFrame)
                newFrame.src = url;
                newFrame.title = "弹出页面";
                newFrame.addEventListener("load", () => {
                    document.getElementById("loading").style.display = "none";
                    newFrame.style.padding = "0px";
                });
            };
            window.addEventListener("message", async (event) => {
                console.log(event.data)
                if (typeof event.data == "string") {
                    if (event.data == "close") {
                        Module.yuni.close();
                    }
                    if (event.data.startsWith("http")) {
                        document.getElementById("loading").style.display = "block";
                        rebuildFrame(event.data);
                    }
                }
            }, false);
            Module.yuni.showFrame = async (url, wide) => {
                //使用iframe渲染设置
                document.getElementById("yuniContainer").style.display = "block";
                await util.sleep(1);
                document.getElementById("yuniContainer").style.opacity = 1;
                document.getElementById("yuni").style.marginTop = "10vh";
                document.getElementById("loading").style.display = "block";
                rebuildFrame(url);
                if (wide) {
                    document.getElementById("yuniFrame").style.maxWidth = "100vw";
                }
            };
            Module.yuni.showNative = async (url, wide) => {
                //使用iframe渲染设置
                document.getElementById("yuniContainer").style.display = "block";
                await util.sleep(1);
                document.getElementById("yuniContainer").style.opacity = 1;
                document.getElementById("yuni").style.marginTop = "10vh";
                document.getElementById("loading").style.display = "block";
                if (document.getElementById("yuniFrame")) {
                    document.getElementById("yuni").removeChild(document.getElementById("yuniFrame"));
                };
                let newFrame = document.createElement("div");
                newFrame.id = "yuniFrame";
                newFrame.style.overflow = "auto";
                document.getElementById("closeBtn").insertAdjacentElement("afterend", newFrame);
                if (wide) {
                    document.getElementById("yuniFrame").style.maxWidth = "100vw";
                }
                util.setInnerHTML(newFrame, await (await fetch("/yuni/" + url + ".yuniml")).text());
                newFrame.style.padding = "0px";
                document.getElementById("loading").style.display = "none";
            };
            Module.yuni.close = async () => {
                document.getElementById("yuni").style.marginTop = "100vh";
                document.getElementById("yuniContainer").style.opacity = 0;
                await util.sleep(500);
                document.getElementById("yuniContainer").style.display = "none";
                document.getElementById("yuni").removeChild(document.getElementById("yuniFrame"));
            };
            document.getElementById("closeBtn").addEventListener("click", async (event) => {
                event.stopPropagation();
                Module.yuni.close();
            })
        },
        showFrame: async (url, wide) => {
            Module.yuni.lazyinit();
            await Module.yuni.showFrame(url, wide);
        },
        showNative: async (url, wide) => {
            Module.yuni.lazyinit();
            await Module.yuni.showNative(url, wide);
        }
    }
}