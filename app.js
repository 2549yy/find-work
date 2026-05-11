const STORAGE_KEYS = {
  prompts: "findwork.prompts",
  history: "findwork.history",
  aiSettings: "findwork.aiSettings",
};

const DEFAULT_AI_SETTINGS = {
  provider: "openai",
  endpoint: "/api/generate",
  model: "gpt-4o-mini",
  apiKey: "",
};

const PROVIDER_DEFAULT_MODELS = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  qwen: "qwen-plus",
  moonshot: "moonshot-v1-8k",
  zhipu: "glm-4-flash",
  custom: "your-model-name",
};

const DEFAULT_PROMPTS = {
  meaning: {
    name: "JD 到底在说什么",
    variables: ["{{JD_TEXT}}"],
    text: `你是一个资深职业顾问，擅长把招聘 JD 翻译成普通人能听懂的大白话。

请根据我提供的 JD，帮我做一次“人话版解读”。

要求：
1. 不要照抄 JD 原文。
2. 不要使用太多职场黑话。
3. 用直接、清楚、具体的语言解释。
4. 如果 JD 里有模糊词，比如“推动”“协同”“赋能”“闭环”“抗压”“owner 意识”，请翻译成真实工作中可能发生的事情。
5. 如果 JD 有潜在风险或隐藏要求，请明确指出。
6. 不要过度美化岗位，也不要制造恐慌，保持客观。

请按照以下结构输出：
【一句话总结】
【这个岗位主要让你做什么】
【他们真正看重什么能力】
【JD 里的黑话翻译】
【必须满足的条件】
【加分但不是必须的条件】
【可能的坑】
【面试时建议确认的问题】

这是 JD：
{{JD_TEXT}}`,
  },
  day: {
    name: "岗位典型的一天",
    variables: ["{{JD_TEXT}}"],
    text: `你是一个熟悉企业真实工作场景的职业分析师。

请根据我提供的 JD，推测这个岗位入职后的“典型工作日”。

要求：
1. 不要写成宣传文案。
2. 不要只写“沟通、协作、执行”这种抽象词。
3. 请写得像真实上班的一天，让我能想象自己坐在工位上会发生什么。
4. 如果 JD 信息不足，请基于岗位职责做合理推测，并标注“推测”。
5. 请区分“日常高频事项”和“阶段性事项”。
6. 请指出这份工作最容易累人的地方。

请按照以下结构输出：
【这个岗位的一天大概长什么样】
【时间线版本】
【你每天大概率会反复做的事】
【你会经常打交道的人】
【阶段性工作】
【这份工作最消耗人的地方】
【适合什么样的人】
【不太适合什么样的人】

这是 JD：
{{JD_TEXT}}`,
  },
  resume: {
    name: "简历修改要求",
    variables: ["{{JD_TEXT}}", "{{RESUME_TEXT}}"],
    text: `你是一个专业简历顾问，擅长根据目标 JD 优化候选人的简历表达。

请根据我提供的 JD 和我的原始简历，帮我优化简历文案。

重要原则：
1. 不能编造我没有做过的经历。
2. 不能虚构数据、职位、公司、项目、奖项或技能。
3. 可以调整表达顺序，让更匹配 JD 的内容更靠前。
4. 可以把模糊表达改得更具体。
5. 可以强化 JD 中出现的关键词和能力要求。
6. 如果需要数据但原简历没有，请用【建议补充真实数据】标记，不要替我编数字。
7. 修改后的表达要自然，不要堆关键词。
8. 请高亮所有被你修改或新增的部分。
9. 每一处重要修改都要解释原因。

请按照以下结构输出：
【JD 重点提取】
【简历匹配度判断】
【优化后的简历】
【逐条修改说明】
【建议补充的信息】
【不建议修改/不建议夸大的地方】

这是 JD：
{{JD_TEXT}}

这是我的原始简历：
{{RESUME_TEXT}}`,
  },
};

const state = {
  prompts: loadPrompts(),
  aiSettings: loadAiSettings(),
  selectedPrompt: "meaning",
  latestOutputs: {
    meaning: "",
    day: "",
    resume: "",
  },
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const clone = (value) => JSON.parse(JSON.stringify(value));

function on(selector, eventName, handler) {
  const element = $(selector);
  if (element) element.addEventListener(eventName, handler);
}

function loadPrompts() {
  const saved = localStorage.getItem(STORAGE_KEYS.prompts);
  if (!saved) return clone(DEFAULT_PROMPTS);

  try {
    return { ...clone(DEFAULT_PROMPTS), ...JSON.parse(saved) };
  } catch {
    return clone(DEFAULT_PROMPTS);
  }
}

function savePrompts() {
  localStorage.setItem(STORAGE_KEYS.prompts, JSON.stringify(state.prompts));
  $("#promptStatus").textContent = "已保存并启用自定义 Prompt";
}

function loadAiSettings() {
  const saved = localStorage.getItem(STORAGE_KEYS.aiSettings);
  if (!saved) return clone(DEFAULT_AI_SETTINGS);

  try {
    return { ...clone(DEFAULT_AI_SETTINGS), ...JSON.parse(saved) };
  } catch {
    return clone(DEFAULT_AI_SETTINGS);
  }
}

function saveAiSettings() {
  localStorage.setItem(STORAGE_KEYS.aiSettings, JSON.stringify(state.aiSettings));
  $("#aiSettingsStatus").innerHTML = `<div class="rule-box"><strong>已保存</strong><p>工作台会使用当前模型设置真实生成结果。</p></div>`;
}

function renderAiSettings() {
  const provider = $("#apiProvider");
  const endpoint = $("#apiEndpoint");
  const model = $("#apiModel");
  const apiKey = $("#apiKey");

  if (provider) provider.value = state.aiSettings.provider;
  if (endpoint) endpoint.value = state.aiSettings.endpoint;
  if (model) model.value = state.aiSettings.model;
  if (apiKey) apiKey.value = state.aiSettings.apiKey;
}

function renderPromptEditor() {
  const prompt = state.prompts[state.selectedPrompt];
  $("#promptName").textContent = prompt.name;
  $("#variableBox").textContent = prompt.variables.join("  ");
  $("#promptEditor").value = prompt.text;

  $$(".prompt-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.prompt === state.selectedPrompt);
  });
}

function validatePrompt(type) {
  const prompt = state.prompts[type];
  const missing = prompt.variables.filter((variable) => !prompt.text.includes(variable));
  return {
    ok: missing.length === 0 && prompt.text.trim().length > 0,
    missing,
  };
}

function validateInput(type) {
  const jd = $("#jdInput").value.trim();
  const resume = $("#resumeInput").value.trim();
  const promptValidation = validatePrompt(type);

  if (!promptValidation.ok) {
    return `当前 Prompt 缺少必要变量：${promptValidation.missing.join("、")}，无法生成结果。`;
  }
  if (!jd) return "请先输入 JD。";
  if (type === "resume" && !resume) return "请先输入简历。";
  return "";
}

function buildPrompt(type) {
  const jd = $("#jdInput").value.trim();
  const resume = $("#resumeInput").value.trim();

  return state.prompts[type].text
    .replaceAll("{{JD_TEXT}}", jd)
    .replaceAll("{{RESUME_TEXT}}", resume);
}

function promptRuleNote(type) {
  return `<p class="rule-note">本结果由「${state.prompts[type].name}」Prompt 生成。修改并保存 Prompt 后，再次生成会按新规则执行。</p>`;
}

function validateAiSettings() {
  if (!state.aiSettings.endpoint.trim()) return "请先在「模型设置」里填写接口地址。";
  if (!state.aiSettings.model.trim()) return "请先在「模型设置」里填写模型名称。";
  if (window.location.protocol === "file:" && state.aiSettings.endpoint.startsWith("/")) {
    return "当前是本地 file 页面，无法调用 /api/generate。请发布到 Vercel/Netlify 后使用，或改填可直连的完整模型接口地址。";
  }
  if (!state.aiSettings.endpoint.startsWith("/") && !state.aiSettings.apiKey.trim()) {
    return "直连外部模型接口时，请先在「模型设置」里填写 API Key。";
  }
  return "";
}

async function callModel(prompt) {
  const settingsError = validateAiSettings();
  if (settingsError) throw new Error(settingsError);
  const useServerlessAdapter = state.aiSettings.endpoint.startsWith("/");

  const response = await fetch(state.aiSettings.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(state.aiSettings.apiKey ? { Authorization: `Bearer ${state.aiSettings.apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...(useServerlessAdapter ? { provider: state.aiSettings.provider } : {}),
      model: state.aiSettings.model,
      messages: [
        {
          role: "system",
          content: "你是一个严谨的中文求职助手。必须严格遵循用户提供的 Prompt，不要额外扩展 Prompt 没要求的结构。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`模型请求失败：${response.status} ${errorText.slice(0, 240)}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("模型没有返回可展示的内容。");
  return content;
}

function renderGeneratedText(text, type) {
  const safe = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, `<span class="highlight">$1</span>`)
    .replace(/\n/g, "<br>");

  return `<div class="generated-text">${safe}</div>${promptRuleNote(type)}`;
}

function setLoading(button, isLoading, text) {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.classList.add("loading");
    button.disabled = true;
    return;
  }
  button.textContent = button.dataset.originalText || button.textContent;
  button.classList.remove("loading");
  button.disabled = false;
}

function extractKeywords(text) {
  const keywordMap = [
    "数据", "增长", "运营", "产品", "项目", "用户", "内容", "策略", "分析", "复盘",
    "沟通", "协同", "交付", "需求", "客户", "销售", "市场", "管理", "设计", "技术",
    "AIGC", "AI", "SQL", "Python", "Excel", "商业化", "留存", "转化", "拉新", "活动",
  ];
  return keywordMap.filter((word) => text.toLowerCase().includes(word.toLowerCase())).slice(0, 8);
}

function detectRole(text) {
  const match = text.match(/岗位名称[:：\s]*([^\n，,。]+)/);
  if (match) return match[1].trim();

  const roles = ["产品经理", "运营", "数据分析师", "项目经理", "市场", "销售", "设计师", "前端", "后端", "AI"];
  return roles.find((role) => text.includes(role)) || "这个岗位";
}

function renderMeaning() {
  const jd = $("#jdInput").value.trim();
  const role = detectRole(jd);
  const keywords = extractKeywords(jd);

  return `
    <h4>【一句话总结】</h4>
    <p>${role}本质上是在找一个能把岗位要求拆成具体动作，并持续交付结果的人。</p>
    <h4>【这个岗位主要让你做什么】</h4>
    <ul>
      <li>把 JD 里的职责转成每天要推进的任务，并对结果负责。</li>
      <li>围绕 ${keywords.slice(0, 3).join("、") || "业务目标"} 做分析、执行、沟通和复盘。</li>
      <li>和相关团队同步信息，处理需求变化、项目进度和交付质量。</li>
      <li>把模糊目标变成方案、文档、数据结果或可落地的执行计划。</li>
    </ul>
    <h4>【他们真正看重什么能力】</h4>
    <ul>
      <li><span class="highlight">理解业务</span>：知道事情为什么做，而不是只完成被分配的动作。</li>
      <li><span class="highlight">推进落地</span>：能盯进度、拆任务、处理卡点。</li>
      <li><span class="highlight">清楚表达</span>：能把问题、方案和结果说清楚。</li>
    </ul>
    <h4>【可能的坑】</h4>
    <ul>
      <li>如果 JD 反复出现“协同、推动、闭环”，说明沟通成本可能不低。</li>
      <li>如果强调“抗压、目标导向”，需要面试确认指标压力和加班情况。</li>
    </ul>
    ${promptRuleNote("meaning")}
  `;
}

function renderDay() {
  const jd = $("#jdInput").value.trim();
  const keywords = extractKeywords(jd);

  return `
    <h4>【这个岗位的一天大概长什么样】</h4>
    <p>这一天大概率不是单线任务，而是在信息同步、具体执行、临时问题和结果复盘之间切换。</p>
    <h4>【时间线版本】</h4>
    <ul>
      <li>09:30-10:30：查看消息、数据或项目状态，确认今天最需要推进的事项。</li>
      <li>10:30-12:00：参加例会或需求沟通，把目标拆成任务、负责人和时间点。</li>
      <li>13:30-15:00：处理核心产出，比如方案、文档、分析、活动、需求或客户材料。</li>
      <li>15:00-17:30：和协作方对齐进度，解决卡点，补充材料，调整方案。</li>
      <li>17:30-下班前：整理今天的结果，更新进展，准备第二天要推进的事情。</li>
    </ul>
    <h4>【你每天大概率会反复做的事】</h4>
    <ul>
      ${(keywords.length ? keywords : ["沟通", "执行", "复盘", "交付"]).map((word) => `<li>围绕 ${word} 做信息判断、任务推进和结果确认。</li>`).join("")}
    </ul>
    <h4>【这份工作最消耗人的地方】</h4>
    <p>最累的部分可能不是单个任务，而是同时处理变化、沟通、催进度和结果压力。</p>
    ${promptRuleNote("day")}
  `;
}

function renderResume() {
  const jd = $("#jdInput").value.trim();
  const resume = $("#resumeInput").value.trim();
  const keywords = extractKeywords(jd);
  const firstLine = resume.split(/\n/).find(Boolean) || "原始简历内容";
  const keywordText = keywords.slice(0, 5).join("、") || "目标岗位要求";

  return `
    <h4>【JD 重点提取】</h4>
    <p>${keywordText}</p>
    <h4>【简历匹配度判断】</h4>
    <p>当前简历可以围绕 JD 关键词进一步强化动作、场景和结果，避免只写“负责”“参与”。</p>
    <h4>【优化后的简历】</h4>
    <p>原文：${escapeHtml(firstLine)}</p>
    <p>改后：<span class="highlight">围绕 ${escapeHtml(keywordText)}，梳理业务目标并推进相关任务落地，沉淀执行过程、协作结果与复盘结论。</span>【建议补充真实数据】</p>
    <h4>【逐条修改说明】</h4>
    <ul>
      <li>把泛泛的经历改成“目标 + 动作 + 结果”的表达，更贴近 JD。</li>
      <li>保留真实性，没有虚构具体数字、项目和职位。</li>
      <li>需要你补充真实数据，例如规模、周期、转化率、效率提升或交付数量。</li>
    </ul>
    ${promptRuleNote("resume")}
  `;
}

async function generateJdOutputs() {
  const meaningError = validateInput("meaning");
  const dayError = validateInput("day");
  const settingsError = validateAiSettings();

  if (meaningError || dayError || settingsError) {
    const error = meaningError || dayError || settingsError;
    $("#meaningResult").innerHTML = `<div class="warning">${error}</div>`;
    $("#dayResult").innerHTML = `<div class="warning">${error}</div>`;
    return;
  }

  const button = $("#generateJdBtn");
  setLoading(button, true, "生成中...");
  $("#meaningResult").innerHTML = `<div class="empty-state"><strong>正在生成</strong><p>使用 Prompt 1 分析 JD...</p></div>`;
  $("#dayResult").innerHTML = `<div class="empty-state"><strong>正在生成</strong><p>使用 Prompt 2 推测岗位日常...</p></div>`;

  try {
    const [meaningText, dayText] = await Promise.all([
      callModel(buildPrompt("meaning")),
      callModel(buildPrompt("day")),
    ]);
    state.latestOutputs.meaning = renderGeneratedText(meaningText, "meaning");
    state.latestOutputs.day = renderGeneratedText(dayText, "day");
    $("#meaningResult").innerHTML = state.latestOutputs.meaning;
    $("#dayResult").innerHTML = state.latestOutputs.day;
  } catch (error) {
    $("#meaningResult").innerHTML = `<div class="warning">${escapeHtml(error.message)}</div>`;
    $("#dayResult").innerHTML = `<div class="warning">${escapeHtml(error.message)}</div>`;
  } finally {
    setLoading(button, false);
  }
}

async function generateResumeOutput() {
  const error = validateInput("resume");
  const settingsError = validateAiSettings();
  if (error || settingsError) {
    $("#resumeResult").innerHTML = `<div class="warning">${error || settingsError}</div>`;
    return;
  }

  const button = $("#generateResumeBtn");
  setLoading(button, true, "优化中...");
  $("#resumeResult").innerHTML = `<div class="empty-state"><strong>正在优化</strong><p>使用 Prompt 3 结合当前 JD 和简历生成结果...</p></div>`;

  try {
    const resumeText = await callModel(buildPrompt("resume"));
    state.latestOutputs.resume = renderGeneratedText(resumeText, "resume");
    $("#resumeResult").innerHTML = state.latestOutputs.resume;
  } catch (modelError) {
    $("#resumeResult").innerHTML = `<div class="warning">${escapeHtml(modelError.message)}</div>`;
  } finally {
    setLoading(button, false);
  }
}

function testPrompt() {
  const editorValue = $("#promptEditor").value;
  const prompt = state.prompts[state.selectedPrompt];
  const missing = prompt.variables.filter((variable) => !editorValue.includes(variable));

  if (missing.length) {
    $("#promptTestResult").innerHTML = `<div class="warning">当前测试 Prompt 缺少必要变量：${missing.join("、")}</div>`;
    return;
  }

  const jd = $("#jdInput").value.trim() || "这里会替换为工作台中的 JD 文本。";
  const resume = $("#resumeInput").value.trim() || "这里会替换为工作台中的简历文本。";
  const compiled = editorValue.replaceAll("{{JD_TEXT}}", jd).replaceAll("{{RESUME_TEXT}}", resume);

  $("#promptTestResult").innerHTML = `
    <h4>测试通过</h4>
    <p>下面是变量替换后的最终 Prompt。接入大模型 API 后，会把这段内容作为生成请求发送。</p>
    <div class="prompt-preview">${escapeHtml(compiled)}</div>
  `;
}

function saveHistory() {
  const jd = $("#jdInput").value.trim();
  const resumeOutput = $("#resumeResult").innerText.trim();

  if (!jd || !resumeOutput || resumeOutput.includes("等待简历输入")) {
    $("#resumeResult").innerHTML = `<div class="warning">请先生成简历优化结果，再保存历史。</div>`;
    return;
  }

  const history = loadHistory();
  history.unshift({
    id: crypto.randomUUID(),
    createdAt: new Date().toLocaleString("zh-CN"),
    title: detectRole(jd),
    jd: jd.slice(0, 180),
    output: resumeOutput.slice(0, 260),
  });
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 20)));
  renderHistory();
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [];
  } catch {
    return [];
  }
}

function renderHistory() {
  const history = loadHistory();
  if (!history.length) {
    $("#historyList").innerHTML = `
      <div class="empty-state panel">
        <strong>还没有历史记录</strong>
        <p>在工作台生成简历优化结果后，可以保存到这里。</p>
      </div>
    `;
    return;
  }

  $("#historyList").innerHTML = history
    .map(
      (item) => `
        <article class="history-item">
          <time>${item.createdAt}</time>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.jd)}...</p>
          <p>${escapeHtml(item.output)}...</p>
        </article>
      `,
    )
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function wireEvents() {
  $$(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".nav-tab").forEach((item) => item.classList.remove("active"));
      $$(".view").forEach((view) => view.classList.remove("active"));
      tab.classList.add("active");
      const targetView = $(`#${tab.dataset.view}View`);
      if (targetView) targetView.classList.add("active");
    });
  });

  $$(".result-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".result-tab").forEach((item) => item.classList.remove("active"));
      $("#meaningResult").classList.remove("active");
      $("#dayResult").classList.remove("active");
      tab.classList.add("active");
      $(`#${tab.dataset.result}Result`).classList.add("active");
    });
  });

  $$(".prompt-item").forEach((item) => {
    item.addEventListener("click", () => {
      state.prompts[state.selectedPrompt].text = $("#promptEditor").value;
      state.selectedPrompt = item.dataset.prompt;
      renderPromptEditor();
    });
  });

  on("#savePromptBtn", "click", () => {
    state.prompts[state.selectedPrompt].text = $("#promptEditor").value;
    savePrompts();
    renderPromptEditor();
  });

  on("#resetPromptBtn", "click", () => {
    state.prompts[state.selectedPrompt] = clone(DEFAULT_PROMPTS[state.selectedPrompt]);
    renderPromptEditor();
  });

  on("#testPromptBtn", "click", testPrompt);
  on("#generateJdBtn", "click", generateJdOutputs);
  on("#generateResumeBtn", "click", generateResumeOutput);
  on("#saveAiSettingsBtn", "click", () => {
    state.aiSettings.provider = $("#apiProvider").value;
    state.aiSettings.endpoint = $("#apiEndpoint").value.trim();
    state.aiSettings.model = $("#apiModel").value.trim();
    state.aiSettings.apiKey = $("#apiKey").value.trim();
    saveAiSettings();
  });
  on("#apiProvider", "change", () => {
    const provider = $("#apiProvider").value;
    $("#apiModel").value = PROVIDER_DEFAULT_MODELS[provider] || PROVIDER_DEFAULT_MODELS.custom;
  });
  on("#clearAiSettingsBtn", "click", () => {
    state.aiSettings = clone(DEFAULT_AI_SETTINGS);
    state.aiSettings.apiKey = "";
    localStorage.removeItem(STORAGE_KEYS.aiSettings);
    renderAiSettings();
    $("#aiSettingsStatus").innerHTML = `<div class="warning">模型设置已清空。重新填写并保存后才能真实生成。</div>`;
  });
  on("#testAiSettingsBtn", "click", async () => {
    state.aiSettings.provider = $("#apiProvider").value;
    state.aiSettings.endpoint = $("#apiEndpoint").value.trim();
    state.aiSettings.model = $("#apiModel").value.trim();
    state.aiSettings.apiKey = $("#apiKey").value.trim();

    const error = validateAiSettings();
    if (error) {
      $("#aiSettingsStatus").innerHTML = `<div class="warning">${error}</div>`;
      return;
    }

    const button = $("#testAiSettingsBtn");
    setLoading(button, true, "测试中...");
    $("#aiSettingsStatus").innerHTML = `<div class="empty-state"><strong>正在测试</strong><p>向模型发送一条短请求...</p></div>`;
    try {
      const text = await callModel("请只回复四个字：连接成功");
      $("#aiSettingsStatus").innerHTML = renderGeneratedText(text, "meaning");
    } catch (modelError) {
      $("#aiSettingsStatus").innerHTML = `<div class="warning">${escapeHtml(modelError.message)}</div>`;
    } finally {
      setLoading(button, false);
    }
  });
  on("#clearJdBtn", "click", () => {
    $("#jdInput").value = "";
  });

  on("#resumeFile", "change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    $("#resumeInput").value = await file.text();
  });

  on("#copyResumeBtn", "click", async () => {
    try {
      await navigator.clipboard.writeText($("#resumeResult").innerText);
    } catch {
      $("#resumeResult").insertAdjacentHTML("afterbegin", `<div class="warning">当前浏览器不允许直接复制，请手动选中结果复制。</div>`);
    }
  });

  on("#saveHistoryBtn", "click", saveHistory);
  on("#clearHistoryBtn", "click", () => {
    localStorage.removeItem(STORAGE_KEYS.history);
    renderHistory();
  });
}

try {
  wireEvents();
  renderPromptEditor();
  renderAiSettings();
  renderHistory();
} catch (error) {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="warning" style="margin: 16px;">页面脚本初始化失败：${escapeHtml(error.message)}。请确认部署的是最新版本，且 index.html 和 app.js 来自同一次提交。</div>`,
  );
  console.error(error);
}
