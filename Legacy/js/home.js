if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
}
if (navigator.userAgent.indexOf("WOW64") > 1) {
    alert("你正在64位操作系统上使用32位浏览器！\n为了更快的访问速度请改用64位浏览器！")
}
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
let GPUinfo = getVideoCardInfo()
if (GPUinfo) {
    let GPUname = GPUinfo.renderer;
    if (GPUinfo.renderer.indexOf("ANGLE") == 0) {
        GPUname = GPUname.substring(GPUname.indexOf(",") + 2, GPUname.indexOf("Direct3D") - 1);
    }
    let GPUele = document.createElement("h6")
    GPUele.innerHTML += "显卡型号：" + atob("PGNvZGUgY2xhc3M9Imxhbmd1YWdlLXBsYWludGV4dCBoaWdobGlnaHRlci1yb3VnZSI+") + GPUname + "</code>"
    document.getElementsByTagName("hr")[1].parentNode.insertBefore(GPUele, document.getElementsByTagName("hr")[1])
} else {
    console.log("Cannot Get GPU Info!")
}
