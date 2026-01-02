window.addEventListener("load", () => {
    console.log("script.js is running!");
    let lastDataTime = null;

    function connectWebSocket() {
        const protocol = location.protocol === "https:" ? "wss" : "ws";
        const socket = new WebSocket(`${protocol}://${location.host}`);

        socket.onopen = () => console.log("WebSocket connection established!");

        socket.onerror = (error) => console.error("WebSocket error:", error);

        socket.onclose = () => {
            console.log("WebSocket connection closed — retrying in 5 seconds...");
            setTimeout(connectWebSocket, 5000); // retry after 5 seconds
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateUI(data);
            lastDataTime = new Date();
            updateTime();
        };
    }

    function updateUI(data) {
        for (let key in data) {
            const el = document.getElementById(key);
            if (el) el.textContent = data[key];
        }
    }

    function updateTime() {
        if (!lastDataTime) return;
        const el = document.getElementById("last-updated");
        if (el) el.textContent = lastDataTime.toLocaleTimeString();
    }

    setInterval(updateTime, 1000);

    connectWebSocket(); // start WebSocket connection
});
