/*
Copyright 2019 Google LLC

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// http://xahlee.info/comp/unicode_arrows.html
var trendChars = ["", "↑↑", "↑", "↗", "→", "↘", "↓", "↓↓", "❓", "⚠️"]

var trendBorder = [
    [],
    [[0, 0, 31, 3, "red"]],
    [[8, 0, 16, 3, "black"]],
    [[16, 0, 16, 3, "black"], [29, 0, 3, 16, "black"]],
    [[29, 8, 3, 16, "black"]],
    [[16, 29, 16, 3, "black"], [29, 16, 3, 16, "black"]],
    [[8, 29, 16, 3, "black"]],
    [[0, 29, 31, 3, "red"]],
];

var canvasElem = document.createElement('canvas')
var canvas = canvasElem.getContext("2d");
canvasElem.width = 32;
canvasElem.height = 32;

function setIcon(value, trendNum) {
    canvas.clearRect(0, 0, canvasElem.width, canvasElem.height);

    let trend = trendBorder[trendNum];
    for (i in trend) {
        canvas.fillStyle = trend[i][4];
        canvas.fillRect(...trend[i].slice(0, 4));
    }

    canvas.fillStyle = "#000";
    canvas.font = "29px 'Arial'";
    canvas.fillText("" + value, 0, 28, 28);

    chrome.browserAction.setIcon(
        { imageData: canvas.getImageData(0, 0, 32, 32) });
}

function handleMessage(event) {
    let data = JSON.parse(event.data);

    let trend = 0;
    if ('trend' in data) {
        trend = data.trend;
    }

    setIcon(data.value, trend);

    chrome.browserAction.setTitle({ title: new Date().toString() });
    if ('timestamp' in data) {
        let last = new Date(data.timestamp * 1000);
        let now = new Date();
        // if data is more than 6 minutes old
        if ((now - last) > 1000 * 6 * 60) {
            setIcon("⚠️", 0)
            chrome.browserAction.setTitle({ title: "Stale data from server" })
        }
    }
    localStorage.setItem("last_timestamp", new Date().valueOf());
    localStorage.setItem("last_message", JSON.stringify(data));
}

function newES() {
    let source_url = localStorage.getItem("source_url");
    if (!source_url) {
        return null;
    }
    let source = new EventSource(source_url);
    source.onmessage = handleMessage;
    return source;
}

function alarmHandler(alarm) {
    if (alarm.name == "verify") {
        lastTimestamp = localStorage.getItem("last_timestamp");
        let last = new Date(parseInt(lastTimestamp));
        let now = new Date();
        // if no updates in 6 minutes
        if ((now - last) > 1000 * 6 * 60) {
            setIcon("🕒", 0)
            chrome.browserAction.setTitle({ title: "No updates in at least 6 minutes." })
        }
    }

}

var source;

function initialize() {
    let source_url = localStorage.getItem("source_url");
    if (!source_url) {
        return null;
    }

    // initialize the icon
    fetch(source_url + "/last", { cache: "no-cache" })
        .then(function (response) {
            if (response.status == 200) {
                return response.text();
            } else {
                return new Promise.reject(response.statusText);
            }
        }).then(function (text) {
            handleMessage({ data: text });
        });
}

function setup() {
    if (!window.EventSource) {
        setIcon("😞", "");
        console.error("EventSource support is required.")
    }

    window.addEventListener('storage', function (e) {
        if (e.key == "source_url") {
            // close old source
            source && source.close();
            // open new one
            source = newES();
        }
    });
    window.addEventListener('online', initialize);

    chrome.alarms.create("verify", { "periodInMinutes": 1 });
    chrome.alarms.onAlarm.addListener(alarmHandler);
    setIcon("?", 0);

    initialize();

    source = newES();

    chrome.management.getSelf(
        function (self) {
            console.log("initialized " + self.name + " " + self.version);
        });
}

setup();

// TODO: switch to https://developer.chrome.com/apps/storage
