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
    }
}