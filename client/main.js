
var socket = io.connect("http://76.28.150.193:8888");

socket.on("load", function (data) {
    console.log(data);
});

socket.emit("save", { studentname: "Chris Marriott", statename: "aState", data: "Goodbye World" });
socket.emit("load", { studentname: "Chris Marriott", statename: "aState" });
socket.emit("load", { studentname: "Chris Marriott", statename: "theState" });


window.onload = function () {
    console.log("starting up da sheild");
    var messages = [];
    var field = document.getElementById("field");
    var username = document.getElementById("username");
    var content = document.getElementById("content");

    socket.on("ping", function (ping) {
        console.log(ping);
        socket.emit("pong");
    });

    socket.on("sync", function (data) {
        messages = data;
        var html = '';
        for (var i = 0; i < messages.length; i++) {
            html += '<b>' + (messages[i].username ? messages[i].username : "Server") + ": </b>";
            html += messages[i].message + "<br />";
        }
        content.innerHTML = html;
        content.scrollTop = content.scrollHeight;
        console.log("sync " + html);
    });

    socket.on("message", function (data) {
        if (data.message) {
            messages.push(data);
            var html = '';
            for (var i = 0; i < messages.length; i++) {
                html += '<b>' + (messages[i].username ? messages[i].username : "Server") + ": </b>";
                html += messages[i].message + "<br />";
            }
            content.innerHTML = html;
            content.scrollTop = content.scrollHeight;
        } else {
            console.log("No message.");
        }

    });

    field.onkeydown = function (e) {
        if (e.keyCode === 13) {
            var text = field.value;
            var name = username.value;
            console.log("message sent " + text);
            socket.emit("send", { message: text, username: name });
            field.value = "";
        }
    };

    socket.on("connect", function () {
        console.log("Socket connected.")
    });
    socket.on("disconnect", function () {
        console.log("Socket disconnected.")
    });
    socket.on("reconnect", function () {
        console.log("Socket reconnected.")
    });

};
