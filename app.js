let editor;

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('drawflow');
  if (!container) return;

  editor = new Drawflow(container);
  editor.reroute = true;
  editor.reroute_fix_curvature = true;
  editor.force_first_input = false;
  editor.start();

  // Export Button
  document.getElementById('exportBtn').addEventListener('click', () => {
    const exportData = editor.export();
    console.log("🔥 Workflow JSON Export:", JSON.stringify(exportData, null, 2));
    showToast('Başarılı', 'İşlem hattı JSON olarak konsola yazdırıldı.', 'success');
  });

  // Clear Button
  document.getElementById('clearBtn').addEventListener('click', () => {
    if(confirm("Tüm işlem hattını temizlemek istediğinize emin misiniz?")) {
      editor.clearModuleSelected();
      closePropertiesPanel();
      showToast('Temizlendi', 'Tuval sıfırlandı.', 'info');
    }
  });

  // Panel Close Button
  document.getElementById('closePropBtn').addEventListener('click', () => {
    closePropertiesPanel();
  });

  // Drawflow Events
  editor.on('nodeSelected', (id) => {
    openPropertiesPanel(id);
  });

  editor.on('nodeUnselected', (id) => {
    closePropertiesPanel();
  });
});

/* ─── Properties Panel Logic ─── */
let activeNodeId = null;

function openPropertiesPanel(id) {
  activeNodeId = id;
  const node = editor.getNodeFromId(id);
  const panel = document.getElementById('propPanel');
  const propBody = document.getElementById('propBody');
  const propTitle = document.getElementById('propTitle');
  
  panel.classList.add('open');
  
  // Clear previous form
  propBody.innerHTML = '';
  
  if (node.name === 'trigger') {
    propTitle.innerText = '⚡ Tetikleyici Ayarları';
    propBody.innerHTML = `
      <div class="form-group">
        <label>Tetikleme Şartı</label>
        <select id="prop_triggerType" onchange="updateNodeData('triggerType', this.value)">
          <option value="webhook" ${node.data.triggerType === 'webhook' ? 'selected' : ''}>Yeni Webhook İsteği</option>
          <option value="cron" ${node.data.triggerType === 'cron' ? 'selected' : ''}>Zamanlanmış (Cron)</option>
          <option value="db" ${node.data.triggerType === 'db' ? 'selected' : ''}>Veritabanı Değişikliği</option>
          <option value="manual" ${node.data.triggerType === 'manual' ? 'selected' : ''}>Manuel Tetikleme</option>
        </select>
      </div>
    `;
  } else if (node.name === 'llm') {
    propTitle.innerText = '🧠 LLM Modeli Ayarları';
    propBody.innerHTML = `
      <div class="form-group">
        <label>Model Seçimi</label>
        <select id="prop_modelName" onchange="updateNodeData('modelName', this.value)">
          <option value="qwen" ${node.data.modelName === 'qwen' ? 'selected' : ''}>Qwen3-4b (Lokal)</option>
          <option value="llama3" ${node.data.modelName === 'llama3' ? 'selected' : ''}>Llama-3-8B (Lokal)</option>
          <option value="gpt4o" ${node.data.modelName === 'gpt4o' ? 'selected' : ''}>GPT-4o (OpenAI API)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Yöntem (Method)</label>
        <select id="prop_method" onchange="updateNodeData('method', this.value)">
          <option value="generate" ${node.data.method === 'generate' ? 'selected' : ''}>Metin Üret (Generate Text)</option>
          <option value="json" ${node.data.method === 'json' ? 'selected' : ''}>JSON Formatı (Structured Output)</option>
          <option value="classify" ${node.data.method === 'classify' ? 'selected' : ''}>Sınıflandırma (Classify)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Sistem Mesajı</label>
        <textarea id="prop_systemMessage" oninput="updateNodeData('systemMessage', this.value)">${node.data.systemMessage || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Kullanıcı İçeriği</label>
        <textarea id="prop_userMessage" oninput="updateNodeData('userMessage', this.value)">${node.data.userMessage || ''}</textarea>
      </div>
      <div class="form-group">
        <label>Sıcaklık (Temp)</label>
        <input type="number" id="prop_temp" step="0.1" min="0" max="1" value="${node.data.temp || '0.7'}" oninput="updateNodeData('temp', this.value)" />
      </div>
    `;
  } else if (node.name === 'agent') {
    propTitle.innerText = '🕵️‍♂️ AI Ajanı Ayarları';
    propBody.innerHTML = `
      <div class="form-group">
        <label>Görev Türü</label>
        <input type="text" id="prop_task" value="${node.data.task || ''}" oninput="updateNodeData('task', this.value)" placeholder="Gelen metni analiz et..." />
      </div>
      <div class="form-group">
        <label>Kullanılabilir Araçlar</label>
        <select id="prop_tool" onchange="updateNodeData('tool', this.value)">
          <option value="serp" ${node.data.tool === 'serp' ? 'selected' : ''}>İnternette Ara (SerpAPI)</option>
          <option value="postgres" ${node.data.tool === 'postgres' ? 'selected' : ''}>PostgreSQL Sorgusu</option>
          <option value="rest" ${node.data.tool === 'rest' ? 'selected' : ''}>REST API İsteği</option>
        </select>
      </div>
    `;
  } else if (node.name === 'output') {
    propTitle.innerText = '📤 Çıktı Ayarları';
    propBody.innerHTML = `
      <div class="form-group">
        <label>Veri Nereye Gidecek?</label>
        <select id="prop_target" onchange="updateNodeData('target', this.value)">
          <option value="webhook" ${node.data.target === 'webhook' ? 'selected' : ''}>Webhook Yanıtı (JSON)</option>
          <option value="slack" ${node.data.target === 'slack' ? 'selected' : ''}>Slack Mesajı</option>
          <option value="email" ${node.data.target === 'email' ? 'selected' : ''}>E-Posta Gönder</option>
        </select>
      </div>
    `;
  }
}

function closePropertiesPanel() {
  activeNodeId = null;
  const panel = document.getElementById('propPanel');
  if(panel) panel.classList.remove('open');
}

function updateNodeData(key, value) {
  if (activeNodeId !== null) {
    const node = editor.getNodeFromId(activeNodeId);
    node.data[key] = value;
    editor.updateNodeDataFromId(activeNodeId, node.data);
  }
}

/* ─── Drag and Drop Handlers ─── */
let mobile_item_selec = '';
let mobile_last_move = null;

function drag(ev) {
  if (ev.type === "touchstart") {
    mobile_item_selec = ev.target.closest(".drag-item").getAttribute('data-node');
  } else {
    ev.dataTransfer.setData("node", ev.target.closest(".drag-item").getAttribute('data-node'));
  }
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drop(ev) {
  if (ev.type === "touchend") {
    let parentdrawflow = document.elementFromPoint(mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY).closest("#drawflow");
    if (parentdrawflow != null) {
      addNodeToDrawFlow(mobile_item_selec, mobile_last_move.touches[0].clientX, mobile_last_move.touches[0].clientY);
    }
    mobile_item_selec = '';
  } else {
    ev.preventDefault();
    let data = ev.dataTransfer.getData("node");
    addNodeToDrawFlow(data, ev.clientX, ev.clientY);
  }
}

/* ─── Add Node Logic ─── */
function addNodeToDrawFlow(name, pos_x, pos_y) {
  if (editor.editor_mode === 'fixed') return;

  pos_x = pos_x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)) - (editor.precanvas.getBoundingClientRect().x * (editor.precanvas.clientWidth / (editor.precanvas.clientWidth * editor.zoom)));
  pos_y = pos_y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)) - (editor.precanvas.getBoundingClientRect().y * (editor.precanvas.clientHeight / (editor.precanvas.clientHeight * editor.zoom)));

  switch (name) {
    case 'trigger':
      const triggerHtml = `
        <div class="title-box">
          <div class="node-icon-wrapper">⚡</div>
          <div class="node-text">
            <span class="node-title">Tetikleyici</span>
            <span class="node-subtitle">Webhook / Event</span>
          </div>
        </div>
      `;
      editor.addNode('trigger', 0, 1, pos_x, pos_y, 'trigger', { triggerType: 'webhook' }, triggerHtml);
      break;

    case 'llm':
      const llmHtml = `
        <div class="title-box">
          <div class="node-icon-wrapper">🧠</div>
          <div class="node-text">
            <span class="node-title">LLM Modeli</span>
            <span class="node-subtitle">Metin İşleme</span>
          </div>
        </div>
      `;
      const llmData = {
        modelName: 'qwen',
        method: 'generate',
        systemMessage: 'Sen yardımcı bir asistansın.',
        userMessage: '{{ $json.input_text }}',
        temp: '0.7'
      };
      editor.addNode('llm', 1, 1, pos_x, pos_y, 'llm', llmData, llmHtml);
      break;

    case 'agent':
      const agentHtml = `
        <div class="title-box">
          <div class="node-icon-wrapper">🕵️‍♂️</div>
          <div class="node-text">
            <span class="node-title">AI Ajanı</span>
            <span class="node-subtitle">Araç Kullanıcı</span>
          </div>
        </div>
      `;
      editor.addNode('agent', 1, 2, pos_x, pos_y, 'agent', { task: '', tool: 'serp' }, agentHtml);
      break;

    case 'output':
      const outputHtml = `
        <div class="title-box">
          <div class="node-icon-wrapper">📤</div>
          <div class="node-text">
            <span class="node-title">Çıktı</span>
            <span class="node-subtitle">Yanıt Döndür</span>
          </div>
        </div>
      `;
      editor.addNode('output', 1, 0, pos_x, pos_y, 'output', { target: 'webhook' }, outputHtml);
      break;
  }
}

/* ─── Toast System ─── */
function showToast(title, desc, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div class="toast-desc">${desc}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
