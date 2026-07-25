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
    document.getElementById('liveConsole.innerHTML = ""';
    document.getElementById('liveConsole').innerHTML = "[System] Console cleared.<br>";
}

// Override standard clicks to log into console
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

        let cleanText = text
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
        for (let item in currentData[sec]) {
            let itemStr = String(item).toLowerCase();
            let secStr = String(sec).toLowerCase();

            if (searchQuery && !itemStr.includes(searchQuery) && !secStr.includes(searchQuery)) {
                continue;
            }

            hasData = true;
            let val = currentData[sec][item];
            let displayRate = "";
            if (val !== null && val !== undefined) {
                displayRate = Array.isArray(val) ? `(${val.map(v => typeof v === 'string' ? `"${v}"` : v).join(', ')})` : JSON.stringify(val);
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

    if (!sec || !item) {
        alert("Section and Item name cannot be empty!");
        return;
    }

    if (editingJson) {
        let oldData = JSON.parse(editingJson);
        if (currentData[oldData.sec] && currentData[oldData.sec][oldData.item] !== undefined) {
            delete currentData[oldData.sec][oldData.item];
            if (Object.keys(currentData[oldData.sec]).length === 0) {
                delete currentData[oldData.sec];
            }
        }
    }

    if (!currentData[sec]) {
        currentData[sec] = {};
    }

    if (rateVal === "") {
        currentData[sec][item] = "";
    } else {
        try {
            let parsed;
            if (rateVal.startsWith('[') && rateVal.endsWith(']')) {
                parsed = JSON.parse(rateVal);
            } else if (rateVal.startsWith('(') && rateVal.endsWith(')')) {
                let inner = rateVal.substring(1, rateVal.length - 1);
                parsed = JSON.parse('[' + inner + ']');
            } else {
                parsed = isNaN(rateVal) ? rateVal.replace(/^["']|["']$/g, '') : Number(rateVal);
            }
            currentData[sec][item] = parsed;
        } catch (e) {
            currentData[sec][item] = rateVal;
        }
    }

    updateSectionDropdown();
    resetForm();
    renderTable();
    logConsole(`Saved item: ${item} in section: ${sec}`);
    alert("Item saved successfully!");
}

function deleteItem(sec, item) {
    if (confirm(`Are you sure you want to delete ${item}?`)) {
        delete currentData[sec][item];
        if (Object.keys(currentData[sec]).length === 0) {
            delete currentData[sec];
        }
        updateSectionDropdown();
        renderTable();
        logConsole(`Deleted item: ${item} from ${sec}`);
    }
}

function generateCode() {
    let output = dictName + " = {\n";
    for (let sec in currentData) {
        output += `    '${sec}': {\n`;
        for (let item in currentData[sec]) {
            let val = currentData[sec][item];
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
    output += "}\n";
    document.getElementById('rawOutput').value = output;
    logConsole("Generated updated Python code.");
}
