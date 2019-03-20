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

function updateElement(id,lsKey, fix) {
    let e = document.getElementById(id);
    let c = localStorage.getItem(lsKey);
    if (fix) {
        c = fix(c);
    }
    e.textContent = c; // for P
    e.value = c; // for input
}

function render() {
    updateElement("source_url", "source_url");
    updateElement("last_timestamp", "last_timestamp", (f) => { return new Date(parseInt(f)); });
    updateElement("last_message", "last_message");
}

function onloader() {
    render(); 

    let pubKey = document.getElementById("source_url");
    pubKey.addEventListener("change", function(event) {
        localStorage.setItem("source_url", pubKey.value);
    });       
}  

window.onload = onloader;