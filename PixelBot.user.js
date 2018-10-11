// ==UserScript==
// @name         Pixel Bot
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       Flyink13, DarkKeks, TheGorox, mnb3000, S1ROZHA, igoose
// @match        https://pixel.vkforms.ru/*
// @downloadURL  https://github.com/igoose1/pixelbot/raw/master/PixelBot.user.js
// @updateURL    https://github.com/igoose1/pixelbot/raw/master/PixelBot.user.js
// @grant        none
// ==/UserScript==
function PixelBot() {
    window.PixelBot = PixelBot;

    function qe(x) {
        if (!document.querySelectorAll(x)) return false;
        return document.querySelectorAll(x)[0];
    }

    PixelBot.url = {
        script: 'https://github.com/igoose1/pixelbot/raw/master/PixelBot.user.js',
        image: 'https://raw.githubusercontent.com/igoose1/pixelbot/master/li7.png'
    };

    PixelBot.urlGen = {
        script: function() {
            return PixelBot.url.script + '?v=' + Math.random();
        },
        image: function() {
            return PixelBot.url.image + '?v=' + Math.random();
        }
    };

    var match = window.location.href.match(/viewer_id=(\d+)/);
    var id = undefined;
    if (match) id = match[1];
    var params = {
        url: window.location.href,
        imageUrl: PixelBot.url.image,
        userId: id
    }

    PixelBot.refreshTime = 300;

    PixelBot.pts = 30;
    PixelBot.tc = "rgb(0, 0, 0)";

    PixelBot.height = 400;
    PixelBot.widht = 1590;

    PixelBot.debug = false;
    PixelBot.doCoordLog = true;

    PixelBot.state = document.createElement("div");
    PixelBot.state.onclick = PixelBot.reload;
    PixelBot.state.textContent = "Загрузка приложения...";
    Object.assign(PixelBot.state.style, {
        background: "rgba(0,0,0,0.5)",
        bottom: "0px",
        right: "0px",
        width: "100%",
        height: "100%",
        lineHeight: "500px",
        textAlign: "center",
        color: "#fff",
        position: "fixed",
        zIndex: 10000
    });
    document.body.appendChild(PixelBot.state);


    PixelBot.loger = document.createElement("div");
    PixelBot.loger.onclick = PixelBot.reload;
    Object.assign(PixelBot.loger.style, {
        background: "rgba(0,0,0,0)",
        top: "0px",
        left: "0px",
        width: "250px",
        height: "100%",
        color: "#fff",
        position: "fixed",
        borderRight: "1px solid #fff",
        fontSize: "11px",
        padding: "12px",
        zIndex: 10001
    });
    document.body.appendChild(PixelBot.loger);

    PixelBot.log = function(x) {
        PixelBot.loger.innerHTML += x + "<br>";
        PixelBot.loger.scrollTo(0, 10000);
    };

    PixelBot.setState = function(s) {
        PixelBot.state.innerHTML = "PixelBot " + s;
        PixelBot.log(s);
    };

    PixelBot.reloadImage = function() {
        PixelBot.img = new Image();
        PixelBot.img2 = new Image();
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");
        PixelBot.img.crossOrigin = "Anonymous";
        PixelBot.img.onload = PixelBot.img2.onload = function() {
            this.loaded = this.src;
            if (PixelBot.img.src != PixelBot.img.loaded || PixelBot.img2.src != PixelBot.img2.loaded) return;
            canvas.width = PixelBot.img.width;
            canvas.height = PixelBot.img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(PixelBot.img, 0, 0, canvas.width, canvas.height);
            var imd = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            ctx.drawImage(PixelBot.img2, 0, 0, canvas.width, canvas.height);
            var imd2 = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            PixelBot.pixs = [];
            for (var i = 0; i < imd.length; i += 4) {
                var x = (i / 4) % canvas.width + 1,
                    y = ~~((i / 4) / canvas.width) + 1;
                if (PixelBot.getColor(imd, i) !== PixelBot.tc && PixelBot.getColor(imd2, i) !== PixelBot.getColor(imd, i)) {
                    PixelBot.pixs.push([x, y, PixelBot.getColor(imd, i)]);
                }
            }
            PixelBot.pixs = PixelBot.pixs
                .sort(function(a, b) {
                    return a[1] - b[1];
                })
                .sort(function(a, b) {
                    return b[0] - a[0];
                });

            canvas = ctx = null;
            PixelBot.setState("Перезагрузил зону защиты. Осталось: " + PixelBot.pixs.length + "px");
        };
        PixelBot.img.src = PixelBot.urlGen.image();
        PixelBot.img2.src = "https://pixel.vkforms.ru/data/1.bmp?r=" + Math.random();
    };


    PixelBot.canvasEvent = function(type, q) {
        if (!PixelBot.canvas) return;
        if (type == "mousewheel") {
            PixelBot.canvas.dispatchEvent(new WheelEvent("mousewheel", q));
        } else {
            PixelBot.canvas.dispatchEvent(new MouseEvent(type, q));
        }
    };

    PixelBot.canvasClick = function(x, y, color) {
        PixelBot.resetZoom();
        PixelBot.canvasMoveTo(0, 0);
        PixelBot.resetZoom(-200);
        PixelBot.canvasMove(-5 * x + 5, -5 * y - 1);
        var pxColor = PixelBot.getColor(PixelBot.ctx.getImageData(3, 3, 1, 1).data, 0);
        var colorEl = qe('.color[style="background-color: ' + color + ';"]');
        if (!colorEl) {
            console.log("Ошибка подбора цвета %c " + color, 'background:' + color + ';');
            PixelBot.setState("Ошибка подбора цвета " + color);
            return PixelBot.draw();
        } else if (pxColor == color) {
            //console.log("совпал цвет " + x + "x" + y + "%c " + pxColor, 'background:' + pxColor + ';');
            //PixelBot.setState("пропускаю " + x + "x" + y + " совпал цвет");
            return PixelBot.draw();
        }
        colorEl.click();
        var q = {
            bubbles: true,
            cancelable: true,
            button: 1,
            clientX: 0,
            clientY: 0
        };
        PixelBot.canvasEvent("mousedown", q);
        PixelBot.canvasEvent("click", q);
        PixelBot.canvasEvent("mousemove", q);
        q.button = 0;
        PixelBot.canvasEvent("mouseup", q);
        qe(".App__confirm button").click();
        var xy = document.querySelectorAll(".App__statistic .value")[1].textContent;
        console.log(x + "x" + y + "%c " + pxColor + " > %c " + color + " " + xy, 'background:' + pxColor + ';', 'background:' + color + ';');
        PixelBot.setState("Поставил точку " + x + "x" + y + " " + xy);
    };

    PixelBot.draw = function() {
        var px = 0;
        if (!PixelBot.pixs.length) {
            PixelBot.setState("Точек нет");
        } else {
            if (PixelBot.pixs.length < 5) {
                px = PixelBot.pixs.shift();
            } else {
                px = PixelBot.pixs.splice(Math.floor(Math.random() * 5), 1)[0];
            }
            PixelBot.canvasClick(px[0], px[1], px[2]);
        }
    };

    PixelBot.canvasMove = function(x, y) {
        var q = {
            bubbles: true,
            cancelable: true,
            button: 1,
            clientX: 0,
            clientY: 0
        };
        PixelBot.canvasEvent("mousedown", q);
        q.clientY = y;
        q.clientX = x;
        PixelBot.canvasEvent("mousemove", q);
        PixelBot.canvasEvent("mouseup", q);
    };

    PixelBot.canvasMoveTo = function(x, y) {
        PixelBot.canvasMove(10000, 10000);
        PixelBot.canvasMove(-40 - x, -149 - y);
    };

    PixelBot.getColor = function(data, i) {
        return "rgb(" + data[i] + ", " + data[i + 1] + ", " + data[i + 2] + ")";
    };

    PixelBot.resetZoom = function(d) {
        PixelBot.canvasEvent("mousewheel", {
            deltaY: d || 100000,
            deltaX: d || 0,
            clientX: 0,
            clientY: 0,
        });
    };

    PixelBot.isTimer = function() {
        if (!qe(".Ttl .Ttl__wait")) return false;
        return [qe(".Ttl .Ttl__wait"), qe(".Ttl .Ttl__wait").style.display];
    };

    PixelBot.init = function() {
        PixelBot.inited = 1;
        PixelBot.setState("запущен.");
    };

    PixelBot.wait = setInterval(function() {
        if(PixelBot.debug)
            debugger;
        if (window.localStorage.getItem('DROP_FIRST_TIME_VK12') != '1') {
            qe(".App__advance > .Button.primary").click();
        } else if (window.localStorage.getItem('DROP_HEADER_VK12') != '1') {
            qe(".Header__close").click();
        } else if (!PixelBot.inited && PixelBot.canvas) {
            PixelBot.ctx = PixelBot.canvas.getContext("2d");
            PixelBot.init();
        } else if (PixelBot.canvas && PixelBot.isTimer()) {
            PixelBot.timer = 1;
        } else if (!PixelBot.canvas) {
            var all = document.querySelectorAll("canvas");
            for (var i = 0; i < all.length; ++i) {
                if (all[i].style.display != 'none') {
                    PixelBot.canvas = all[i];
                }
            }
        } else if (!PixelBot.pts) {
            PixelBot.reload();
            PixelBot.pts = 100;
        } else if (PixelBot.inited && PixelBot.canvas) {
            PixelBot.pts--;
            PixelBot.draw();
        }
    }, 1e3 / 2);

    PixelBot.refresh = setTimeout(function() {
        location.reload();
    }, PixelBot.refreshTime * 1e3);

    PixelBot.reload = function() {
        PixelBot.state.outerHTML = "";
        PixelBot.loger.outerHTML = "";
        clearInterval(PixelBot.wait);
        var script = document.createElement('script');
        script.src = PixelBot.urlGen.script();
        document.body.appendChild(script);
    };

    PixelBot.reloadImage();
    console.log("PixelBot loaded");
}

if (window.loaded) {
    PixelBot();
} else {
    var inject = function() {
        window.loaded = 1;
        var script = document.createElement('script');
        script.appendChild(document.createTextNode('(' + PixelBot + ')();'));
        (document.body || document.head || document.documentElement).appendChild(script);
    };

    if (document.readyState == 'complete') {
        inject();
    } else {
        window.addEventListener("load", function() {
            inject();
        });
    }
}
