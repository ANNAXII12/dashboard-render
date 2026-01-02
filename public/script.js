window.addEventListener("load", () => {
    console.log("script.js is running!");

    // Connect to WebSocket server
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}`);

    //Store last received data time
    let lastDataTime = null;

    // When WebSocket opens
    socket.onopen = () => {
        console.log("WebSocket connection established!");
    };

    // If WebSocket has an error
    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
    };

    // When WebSocket closes
    socket.onclose = () => {
        console.log("WebSocket connection closed");
    };

    // When server sends data
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateUI(data);

        lastDataTime = new Date();
        updateTime();
    };

    // Update dashboard values
    function updateUI(data) {
        for (let key in data) {
            const el = document.getElementById(key);
            if (el) el.textContent = data[key];
        }
    }

    // Update last updated time (HH:MM:SS)
    function updateTime() {
        if (!lastDataTime) return;
        const timeString = lastDataTime.toLocaleTimeString();
        const el = document.getElementById("last-updated");
        if (el) el.textContent = timeString;
    }

    // Refresh time every second
    setInterval(updateTime, 1000);
});
