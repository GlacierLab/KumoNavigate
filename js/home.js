if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js', {scope: '/'})
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
var GPUinfo = getVideoCardInfo()
if (GPUinfo) {
    var GPUname = GPUinfo.renderer;
    var GPUdriver = false;
    if (GPUinfo.renderer.indexOf("ANGLE") == 0) {
        GPUdriver = GPUname.substring(GPUname.indexOf("-") + 1, GPUname.length-1)
        GPUname = GPUname.substring(GPUname.indexOf(",") + 2, GPUname.indexOf("Direct3D") - 1);
    }
    var GPUele = document.createElement("h6")
    GPUele.innerHTML += "显卡型号：" + atob("PGNvZGUgY2xhc3M9Imxhbmd1YWdlLXBsYWludGV4dCBoaWdobGlnaHRlci1yb3VnZSI+") + GPUname + "</code>"
    if (GPUdriver) {
        GPUele.innerHTML += "显卡驱动：" + atob("PGNvZGUgY2xhc3M9Imxhbmd1YWdlLXBsYWludGV4dCBoaWdobGlnaHRlci1yb3VnZSI+") + GPUdriver + "</code>"
    }
    if (navigator.userAgent.indexOf("Firefox") > 1) {
        GPUele.innerHTML +="Firefox的某个Bug可能导致未能正确检测"
    }
    document.getElementsByTagName("hr")[1].parentNode.insertBefore(GPUele, document.getElementsByTagName("hr")[1])
} else {
    console.log("Cannot Get GPU Info!")
}
