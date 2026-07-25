let currentData = {};
let dictName = "DATA";
let currentFileName = "";

async function askGroqAI(errorMessage) {
    const apiKey = document.getElementById('userApiKey').value.trim();
    if (!apiKey) {
        alert("Pehle upar diye gaye box mein Groq API key enter karein!");
        return;
    }

    const url = "https://api.groq.com/openai/v1/chat/completions";

    try {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert web developer and debugging assistant. Fix code errors concisely."
                    },
                    {
                        role: "user",
                        content: `Yeh error ya issue aa raha hai, isay fix karne ka tarika do: ${errorMessage}`
                    }
                ]
            })
        });

        let data = await response.json();
        let aiReply = data.choices[0].message.content;
        console.log("AI Fix Suggestion:", aiReply);
        alert("AI Assistant Response:\n\n" + aiReply);
    } catch (error) {
        console.error("AI API Error:", error);
    }
}

async function loadSelectedFile() {
    let filename = document.getElementById('fileSelector').value;
    if (!filename) return;
    currentFileName = filename;

    try {
        let response = await fetch(filename + "?t=" + new Date().getTime());
        if (!response.ok) throw new Error("File load nahi ho saki!");
        let text = await response.text();

        let match = text.match(/([a-zA-Z0-9_]+)\s*=\s*(\{[\s\S]*\})/);
        if (match) {
            dictName = match[1];
            text = match[2];
        }

        let cleanText = text
            .replace(/#.*$/gm, '')
            .replace(/\b(with|def|return|if|else|for|in)\b[^\n]*\n?/g, '')
            .replace(/\bdef\s+[a-zA-Z0-9_]+\s*\(.*?\)(\s*->\s*[a-zA-Z0-9_]+)?\s*:/g, '')
            .replace(/["']{3}[\s\S]*?["']{3}/g, '')
            .replace(/\bTrue\b/g, 'true')
            .replace(/\bFalse\b/g, 'false')
            .replace(/\bNone\b/g, 'null');

        let words = cleanText.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        let uniqueWords = [...new Set(words)];
        let mockVars = "";
        let reserved = ['true', 'false', 'null'];
        for(let w of uniqueWords) {
            if(!reserved.includes(w)) {
                mockVars += `let ${w} = "${w}";\n`;
            }
        }

        currentData = (new Function(mockVars + "return " + cleanText))();
        updateSectionDropdown();
        renderTable();
        alert(filename + " successfully load ho gayi!");
    } catch (e) {
        askGroqAI(e.message);
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

            if (searchQuery && !itemStr.startsWith(searchQuery) && !secStr.startsWith(searchQuery) && !itemStr.includes(searchQuery) && !secStr.includes(searchQuery)) {
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
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetForm() {
    document.getElementById('secSelect').value = "";
    document.getElementById('newSecName').value = "";
    document.getElementById('newSecName').style.display = 'none';
    document.getElementById('itemName').value = "";
    document.getElementById('itemRate').value = "";
    document.getElementById('editingOldItem').value = "";
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
}
