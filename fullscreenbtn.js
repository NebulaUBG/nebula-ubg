document.getElementById("fullscreen-btn").addEventListener("click", function() {
    const iframe = document.getElementById("gameframe");
    if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
    } else if (iframe.webkitRequestFullscreen) { // Chrome, Safari, Opera
        iframe.webkitRequestFullscreen();
    } else if (iframe.mozRequestFullScreen) { // Firefox
        iframe.mozRequestFullScreen();
    } else if (iframe.msRequestFullscreen) { // IE, Edge
        iframe.msRequestFullscreen();
    }
});