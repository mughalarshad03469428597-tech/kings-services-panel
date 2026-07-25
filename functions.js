/* ==========================================
   Project: Multi-File Admin Panel
   File: functions.js
   Version: 0.3
   ========================================== */

let currentData = {};
let dictName = "DATA";
let currentFileName = "";

function logConsole(message) {
    let consoleBox = document.getElementById('liveConsole');
    if (consoleBox) {
        let time = new Date().toLocaleTimeString();
        consoleBox.innerHTML += `[${time}] ${message}<br>`;
        consoleBox.scrollTop = consoleBox.scrollHeight;
    }
}

function clearConsole() {
    let consoleBox = document.getElementById('liveConsole');
    if (consoleBox) {
        consoleBox.innerHTML = "[System] Console cleared.<br>";
    }
}

document.addEventListener('click', function(event) {
    let target = event.target;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'SELECT') {
        let name = target.id || target.innerText || target.placeholder || target.tagName;
        logConsole(`Clicked on element: <span style="color:#03dac6;">${name}</span>`);
    }
});

async function sendChatMessage() {
    let inputField = document.getElementById('chatInput');
    let userMsg = inputField.value.trim();
    if (!userMsg) return;

    let chatHistory = document.getElementById('chatHistory');
    chatHistory.innerHTML += `<div style="margin-bottom: 8px; color: #fff;"><b>Aap:</b> ${userMsg}</div>`;
    inputField.value = "";
    chatHistory.scrollTop = chatHistory.scrollHeight;

    logConsole(`User sent chat query: ${userMsg}`);
    let apiKey = document.getElementById('userApiKey').value.trim();
    if (!apiKey) {
        alert("Pehle API key enter karein!");
        return;
    }

    try {
        let response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a helpful web assistant." },
                    { role: "user", content: userMsg }
                ]
            })
        });

        let data = await response.json();
        let reply = data.choices[0].message.content;

        chatHistory.innerHTML += `<div style="margin-bottom: 8px; color: #03dac6; background: #1a1a1a; padding: 6px; border-radius: 4px;">
            <b>AI:</b> <span class="ai-reply-text">${reply}</span><br>
            <button style="margin-top: 5px; font-size: 10px; padding: 2px 6px; background: #444;" onclick="copyText(this)">Copy Text</button>
        </div>`;
        chatHistory.scrollTop = chatHistory.scrollHeight;
        logConsole("AI responded successfully.");
    } catch (err) {
        logConsole(`Chat Error: ${err.message}`);
    }
}

function copyText(btn) {
    let textToCopy = btn.previousElementSibling.previousElementSibling.innerText;
    navigator.clipboard.writeText(textToCopy);
    alert("Text copied to clipboard!");
    logConsole("Copied AI response text.");
}

async function loadSelectedFile() {
    let filename = document.getElementById('fileSelector').value;
    if (!filename) return;
    currentFileName = filename;
    logConsole(`Loading file: ${filename}`);

    try {
        let response = await fetch(filename + "?t=" + new Date().getTime());
        if (!response.ok) throw new Error("File load nahi ho saki! HTTP status: " + response.status);
        let text = await response.text();

        let match = text.match(/([a-zA-Z0-9_]+)\s*=\s*(\{[\s\S]*\})/);
        if (match) {
            dictName = match[1];
            text = match[2];
        } else {
            let firstBrace = text.indexOf('{');
            let lastBrace = text.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                text = text.substring(firstBrace, lastBrace + 1);
            }
        }

        let convertedText = text.replace(/\(/g, '[').replace(/\)/g, ']');

        let cleanText = convertedText
            .replace(/#.*$/gm, '')
            .replace(/["']{3}[\s\S]*?["']{3}/g, '')
            .replace(/\bTrue\b/g, 'true')
            .replace(/\bFalse\b/g, 'false')
            .replace(/\bNone\b/g, 'null');

        try {
            currentData = (new Function("return " + cleanText))();
        } catch (evalErr) {
            let looserText = cleanText.replace(/'/g, '"');
            currentData = JSON.parse(looserText);
        }

        updateSectionDropdown();
        renderTable();
        logConsole(`Successfully loaded and parsed ${filename}`);
        alert(filename + " successfully load ho gayi!");
    } catch (e) {
        logConsole(`Error loading file: ${e.message}`);
        alert("Error loading file: " + e.message);
    }
}

function updateSectionDropdown() {
    let secSelect = document.getElementById('secSelect');
    secSelect.innerHTML = `<option value="">-- Select or Add Section --</option><option value="NEW_SEC">➕ Add New Section...</option>`;
    for (let sec in currentData) {
        let opt = document.createElement('option');
        opt.value = sec;
        opt.textContent = sec;
        secSelect.appendChild(opt);
    }
}

function handleSectionChange() {
    let val = document.getElementById('secSelect').value;
    let newSecInput = document.getElementById('newSecName');
    if (val === 'NEW_SEC') {
        newSecInput.style.display = 'block';
        newSecInput.value = '';
        newSecInput.focus();
    } else {
        newSecInput.style.display = 'none';
        newSecInput.value = val;
    }
}

function renderTable() {
    let tbody = document.getElementById('tableBody');
    let searchQuery = document.getElementById('searchBox').value.toLowerCase().trim();
    tbody.innerHTML = "";
    let hasData = false;

    for (let sec in currentData) {
        let secContent = currentData[sec];
        
        if (typeof secContent !== 'object' || secContent === null) {
            let valStr = String(secContent);
            if (searchQuery && !sec.toLowerCase().includes(searchQuery) && !valStr.toLowerCase().includes(searchQuery)) {
                continue;
            }
            hasData = true;
            let tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${sec}</b></td>
                            <td>-</td>
                            <td>${valStr}</td>
                            <td>
                                <button class="edit-btn" onclick="editItem('${sec.replace(/'/g, "\\'")}', '', \`${valStr}\`)">Edit</button>
                                <button class="delete-btn" onclick="deleteItem('${sec.replace(/'/g, "\\'")}', '')">Delete</button>
                            </td>`;
            tbody.appendChild(tr);
            continue;
        }

        for (let item in secContent) {
            let itemStr = String(item).toLowerCase();
            let secStr = String(sec).toLowerCase();

            if (searchQuery && !itemStr.includes(searchQuery) && !secStr.includes(searchQuery)) {
                continue;
            }

            hasData = true;
            let val = secContent[item];
            let displayRate = "";
            
            if (val !== null && val !== undefined) {
                if (Array.isArray(val)) {
                    displayRate = val.map(v => typeof v === 'string' ? v : v).join(', ');
                } else if (typeof val === 'string') {
                    displayRate = val;
                } else {
                    displayRate = val;
                }
            }

            let tr = document.createElement('tr');
            tr.innerHTML = `<td><b>${sec}</b></td>
                            <td>${item}</td>
                            <td>${displayRate}</td>
                            <td>
                                <button class="edit-btn" onclick="editItem('${sec.replace(/'/g, "\\'")}', '${item}', \`${displayRate}\`)">Edit</button>
                                <button class="delete-btn" onclick="deleteItem('${sec.replace(/'/g, "\\'")}', '${item}')">Delete</button>
                            </td>`;
            tbody.appendChild(tr);
        }
    }
    if (!hasData) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#ff6b6b;">No matching items found.</td></tr>`;
    }
}

// Helper function to inject Stepper / Arrow controls next to Rate field dynamically
function setupRateControls() {
    let rateInput = document.getElementById('itemRate');
    if (!rateInput) return;
    
    // Check if controls already exist
    let parent = rateInput.parentNode;
    let existingWrapper = document.getElementById('rateControlWrapper');
    if (existingWrapper) return;

    let wrapper = document.createElement('div');
    wrapper.id = 'rateControlWrapper';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '8px';
    wrapper.style.marginTop = '5px';

    rateInput.parentNode.insertBefore(wrapper, rateInput.nextSibling);
    wrapper.appendChild(rateInput);

    // Step selector dropdown (0.1, 0.5, 1, 10)
    let stepSelect = document.createElement('select');
    stepSelect.id = 'rateStepSelect';
    stepSelect.style.padding = '5px';
    stepSelect.style.background = '#222';
    stepSelect.style.color = '#fff';
    stepSelect.style.border = '1px solid #444';
    stepSelect.innerHTML = `
        <option value="0.1">Step: 0.1</option>
        <option value="0.5">Step: 0.5</option>
        <option value="1" selected>Step: 1.0</option>
        <option value="5">Step: 5.0</option>
        <option value="10">Step: 10.0</option>
    `;
    wrapper.appendChild(stepSelect);

    // Up Button
    let upBtn = document.createElement('buttontype'); // styled button
    let upButton = document.createElement('button');
    upButton.type = 'button';
    upButton.innerText = '➕ Up';
    upButton.style.padding = '5px 10px';
    upButton.style.background = '#28a745';
    upButton.style.color = '#fff';
    upButton.style.border = 'none';
    upButton.style.cursor = 'pointer';
    upButton.onclick = function() { adjustRate(1); };
    wrapper.appendChild(upButton);

    // Down Button
    let downButton = document.createElement('button');
    downButton.type = 'button';
    downButton.innerText = '➖ Down';
    downButton.style.padding = '5px 10px';
    downButton.style.background = '#dc3545';
    downButton.style.color = '#fff';
    downButton.style.border = 'none';
    downButton.style.cursor = 'pointer';
    downButton.onclick = function() { adjustRate(-1); };
    wrapper.appendChild(downButton);
}

// Function to increase or decrease rate based on step and auto sync currencies if needed
function adjustRate(direction) {
    let rateInput = document.getElementById('itemRate');
    let stepSelect = document.getElementById('rateStepSelect');
    let step = parseFloat(stepSelect.value) || 1;
    let valStr = rateInput.value.trim();

    // Extract numbers if string contains currency signs like $
    let numMatch = valStr.match(/([\d\.]+)/);
    if (numMatch) {
        let currentNum = parseFloat(numMatch[1]);
        if (!isNaN(currentNum)) {
            let newNum = currentNum + (direction * step);
            if (newNum < 0) newNum = 0;
            // Round to 2 decimal places to avoid floating point bugs
            newNum = Math.round(newNum * 100) / 100;

            // Preserve currency symbol or format if it had $
            if (valStr.includes('$')) {
                rateInput.value = `"$${newNum}"`;
            } else {
                rateInput.value = newNum;
            }
            logConsole(`Rate adjusted to: ${rateInput.value}`);
            return;
        }
    }
    // If pure number or empty
    let currentNum = parseFloat(valStr) || 0;
    let newNum = Math.max(0, Math.round((currentNum + (direction * step)) * 100) / 100);
    rateInput.value = newNum;
    logConsole(`Rate adjusted to: ${newNum}`);
}

function editItem(sec, item, rate) {
    let secSelect = document.getElementById('secSelect');
    let newSecInput = document.getElementById('newSecName');
    
    secSelect.value = sec;
    if (secSelect.value !== sec) {
        secSelect.value = 'NEW_SEC';
        newSecInput.style.display = 'block';
        newSecInput.value = sec;
    } else {
        newSecInput.style.display = 'none';
        newSecInput.value = sec;
    }

    document.getElementById('itemName').value = item;
    document.getElementById('itemRate').value = rate;
    document.getElementById('editingOldItem').value = JSON.stringify({sec: sec, item: item});
    
    setupRateControls(); // Ensure up/down arrow controls are active
    logConsole(`Editing item: ${item} under ${sec}`);
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetForm() {
    document.getElementById('secSelect').value = "";
    document.getElementById('newSecName').value = "";
    document.getElementById('newSecName').style.display = 'none';
    document.getElementById('itemName').value = "";
    document.getElementById('itemRate').value = "";
    document.getElementById('editingOldItem').value = "";
    logConsole("Form reset.");
}

function saveItem() {
    let secSelectVal = document.getElementById('secSelect').value;
    let sec = (secSelectVal === 'NEW_SEC' || !secSelectVal) ? document.getElementById('newSecName').value.trim() : secSelectVal;
    let item = document.getElementById('itemName').value.trim();
    let rateVal = document.getElementById('itemRate').value.trim();
    let editingJson = document.getElementById('editingOldItem').value;

    if (!sec) {
        alert("Section name cannot be empty!");
        return;
    }

    if (editingJson) {
        let oldData = JSON.parse(editingJson);
        if (currentData[oldData.sec]) {
            if (oldData.item !== "") {
                if (currentData[oldData.sec][oldData.item] !== undefined) {
                    delete currentData[oldData.sec][oldData.item];
                    if (Object.keys(currentData[oldData.sec]).length === 0) {
                        delete currentData[oldData.sec];
                    }
                }
            } else {
                delete currentData[oldData.sec];
            }
        }
    }

    let parsedVal = rateVal;
    if (rateVal !== "") {
        if (rateVal.includes(',')) {
            parsedVal = rateVal.split(',').map(v => {
                let cleanV = v.trim().replace(/^["']|["']$/g, '');
                return isNaN(cleanV) ? cleanV : Number(cleanV);
            });
        } else {
            let cleanV = rateVal.replace(/^["']|["']$/g, '');
            parsedVal = isNaN(cleanV) ? cleanV : Number(cleanV);
        }
    }

    if (item === "") {
        currentData[sec] = parsedVal;
    } else {
        if (typeof currentData[sec] !== 'object' || Array.isArray(currentData[sec]) || currentData[sec] === null) {
            currentData[sec] = {};
        }
        currentData[sec][item] = parsedVal;
    }

    updateSectionDropdown();
    resetForm();
    renderTable();
    logConsole(`Saved item: ${item} in section: ${sec}`);
    alert("Item saved successfully!");
}

function deleteItem(sec, item) {
    if (confirm(`Are you sure you want to delete?`)) {
        if (item !== "") {
            delete currentData[sec][item];
            if (Object.keys(currentData[sec]).length === 0) {
                delete currentData[sec];
            }
        } else {
            delete currentData[sec];
        }
        updateSectionDropdown();
        renderTable();
        logConsole(`Deleted from ${sec}`);
    }
}

function generateCode() {
    let output = dictName + " = {\n";
    for (let sec in currentData) {
        let secContent = currentData[sec];
        if (typeof secContent !== 'object' || secContent === null) {
            let valStr = typeof secContent === 'string' ? `'${secContent}'` : secContent;
            output += `    '${sec}': ${valStr},\n`;
        } else {
            output += `    '${sec}': {\n`;
            for (let item in secContent) {
                let val = secContent[item];
                let valStr = "";
                if (val === "" || val === null || val === undefined) {
                    valStr = "''";
                } else if (Array.isArray(val)) {
                    let innerVals = val.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
                    valStr = `(${innerVals})`;
                } else if (typeof val === 'string') {
                    valStr = `'${val}'`;
                } else {
                    valStr = val;
                }
                output += `        '${item}': ${valStr},\n`;
            }
            output += `    },\n`;
        }
    }
    output += "}\n";
    document.getElementById('rawOutput').value = output;
    logConsole("Generated updated Python code.");
}
