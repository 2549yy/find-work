(function () {
  var STORAGE_KEYS = {
    prompts: "findwork.prompts",
    history: "findwork.history",
    aiSettings: "findwork.aiSettings"
  };

  var DEFAULT_AI_SETTINGS = {
    provider: "openai",
    endpoint: "/api/generate",
    model: "gpt-4o-mini",
    apiKey: ""
  };

  var PROVIDER_DEFAULT_MODELS = {
    openai: "gpt-4o-mini",
    deepseek: "deepseek-chat",
    qwen: "qwen-plus",
    moonshot: "moonshot-v1-8k",
    zhipu: "glm-4-flash",
    custom: "your-model-name"
  };

  var DEFAULT_PROMPTS = {
    meaning: {
      name: "JD 到底在说什么",
      variables: ["{{JD_TEXT}}"],
      text:
        "你是一个资深职业顾问，擅长把招聘 JD 翻译成普通人能听懂的大白话。\n\n" +
        "请根据我提供的 JD，帮我做一次“人话版解读”。\n\n" +
        "要求：\n" +
        "1. 不要照抄 JD 原文。\n" +
        "2. 不要使用太多职场黑话。\n" +
        "3. 用直接、清楚、具体的语言解释。\n" +
        "4. 如果 JD 里有模糊词，比如“推动”“协同”“赋能”“闭环”“抗压”“owner 意识”，请翻译成真实工作中可能发生的事情。\n" +
        "5. 如果 JD 有潜在风险或隐藏要求，请明确指出。\n" +
        "6. 不要过度美化岗位，也不要制造恐慌，保持客观。\n\n" +
        "请按照以下结构输出：\n" +
        "【一句话总结】\n【这个岗位主要让你做什么】\n【他们真正看重什么能力】\n【JD 里的黑话翻译】\n【必须满足的条件】\n【加分但不是必须的条件】\n【可能的坑】\n【面试时建议确认的问题】\n\n" +
        "这是 JD：\n{{JD_TEXT}}"
    },
    day: {
      name: "岗位典型的一天",
      variables: ["{{JD_TEXT}}"],
      text:
        "你是一个熟悉企业真实工作场景的职业分析师。\n\n" +
        "请根据我提供的 JD，推测这个岗位入职后的“典型工作日”。\n\n" +
        "要求：\n" +
        "1. 不要写成宣传文案。\n" +
        "2. 不要只写“沟通、协作、执行”这种抽象词。\n" +
        "3. 请写得像真实上班的一天，让我能想象自己坐在工位上会发生什么。\n" +
        "4. 如果 JD 信息不足，请基于岗位职责做合理推测，并标注“推测”。\n" +
        "5. 请区分“日常高频事项”和“阶段性事项”。\n" +
        "6. 请指出这份工作最容易累人的地方。\n\n" +
        "请按照以下结构输出：\n" +
        "【这个岗位的一天大概长什么样】\n【时间线版本】\n【你每天大概率会反复做的事】\n【你会经常打交道的人】\n【阶段性工作】\n【这份工作最消耗人的地方】\n【适合什么样的人】\n【不太适合什么样的人】\n\n" +
        "这是 JD：\n{{JD_TEXT}}"
    },
    resume: {
      name: "简历修改要求",
      variables: ["{{JD_TEXT}}", "{{RESUME_TEXT}}"],
      text:
        "你是一个专业简历顾问，擅长根据目标 JD 优化候选人的简历表达。\n\n" +
        "请根据我提供的 JD 和我的原始简历，帮我优化简历文案。\n\n" +
        "重要原则：\n" +
        "1. 不能编造我没有做过的经历。\n" +
        "2. 不能虚构数据、职位、公司、项目、奖项或技能。\n" +
        "3. 可以调整表达顺序，让更匹配 JD 的内容更靠前。\n" +
        "4. 可以把模糊表达改得更具体。\n" +
        "5. 可以强化 JD 中出现的关键词和能力要求。\n" +
        "6. 如果需要数据但原简历没有，请用【建议补充真实数据】标记，不要替我编数字。\n" +
        "7. 修改后的表达要自然，不要堆关键词。\n" +
        "8. 请高亮所有被你修改或新增的部分。\n" +
        "9. 每一处重要修改都要解释原因。\n\n" +
        "请按照以下结构输出：\n" +
        "【JD 重点提取】\n【简历匹配度判断】\n【优化后的简历】\n【逐条修改说明】\n【建议补充的信息】\n【不建议修改/不建议夸大的地方】\n\n" +
        "这是 JD：\n{{JD_TEXT}}\n\n这是我的原始简历：\n{{RESUME_TEXT}}"
    }
  };

  var state = {
    prompts: loadObject(STORAGE_KEYS.prompts, DEFAULT_PROMPTS),
    aiSettings: loadObject(STORAGE_KEYS.aiSettings, DEFAULT_AI_SETTINGS),
    selectedPrompt: "meaning"
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  function on(selector, eventName, handler) {
    var el = $(selector);
    if (el) el.addEventListener(eventName, handler);
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function loadObject(key, fallback) {
    var saved = localStorage.getItem(key);
    if (!saved) return clone(fallback);
    try {
      var parsed = JSON.parse(saved);
      var copy = clone(fallback);
      for (var name in parsed) copy[name] = parsed[name];
      return copy;
    } catch (error) {
      return clone(fallback);
    }
  }

  function savePrompts() {
    localStorage.setItem(STORAGE_KEYS.prompts, JSON.stringify(state.prompts));
    setHtml("#promptStatus", "已保存并启用自定义 Prompt");
  }

  function saveAiSettings() {
    localStorage.setItem(STORAGE_KEYS.aiSettings, JSON.stringify(state.aiSettings));
    setHtml("#aiSettingsStatus", '<div class="rule-box"><strong>已保存</strong><p>工作台会使用当前模型设置真实生成结果。</p></div>');
  }

  function setHtml(selector, html) {
    var el = $(selector);
    if (el) el.innerHTML = html;
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function replaceToken(text, token, value) {
    return String(text).split(token).join(value);
  }

  function buildPrompt(type) {
    var jd = ($("#jdInput") && $("#jdInput").value.trim()) || "";
    var resume = ($("#resumeInput") && $("#resumeInput").value.trim()) || "";
    var prompt = state.prompts[type].text;
    prompt = replaceToken(prompt, "{{JD_TEXT}}", jd);
    prompt = replaceToken(prompt, "{{RESUME_TEXT}}", resume);
    return prompt;
  }

  function validatePrompt(type) {
    var prompt = state.prompts[type];
    var missing = [];
    for (var i = 0; i < prompt.variables.length; i += 1) {
      if (prompt.text.indexOf(prompt.variables[i]) === -1) missing.push(prompt.variables[i]);
    }
    return missing;
  }

  function validateInput(type) {
    var jd = ($("#jdInput") && $("#jdInput").value.trim()) || "";
    var resume = ($("#resumeInput") && $("#resumeInput").value.trim()) || "";
    var missing = validatePrompt(type);
    if (missing.length) return "当前 Prompt 缺少必要变量：" + missing.join("、") + "，无法生成结果。";
    if (!jd) return "请先输入 JD。";
    if (type === "resume" && !resume) return "请先输入简历。";
    return "";
  }

  function validateAiSettings() {
    if (!state.aiSettings.endpoint) return "请先在「模型设置」里填写接口地址。";
    if (!state.aiSettings.model) return "请先在「模型设置」里填写模型名称。";
    if (window.location.protocol === "file:" && state.aiSettings.endpoint.indexOf("/") === 0) {
      return "当前是本地 file 页面，无法调用 /api/generate。请发布到 Vercel 后使用，或改填可直连的完整模型接口地址。";
    }
    if (state.aiSettings.endpoint.indexOf("/") !== 0 && !state.aiSettings.apiKey) {
      return "直连外部模型接口时，请先在「模型设置」里填写 API Key。";
    }
    return "";
  }

  function renderGeneratedText(text, type) {
    var safe = escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<span class="highlight">$1</span>').replace(/\n/g, "<br>");
    return '<div class="generated-text">' + safe + '</div><p class="rule-note">本结果由「' + escapeHtml(state.prompts[type].name) + '」Prompt 生成。</p>';
  }

  function callModel(prompt) {
    var settingsError = validateAiSettings();
    if (settingsError) return Promise.reject(new Error(settingsError));

    var headers = { "Content-Type": "application/json" };
    var payload = {
      model: state.aiSettings.model,
      messages: [
        {
          role: "system",
          content: "你是一个严谨的中文求职助手。必须严格遵循用户提供的 Prompt，不要额外扩展 Prompt 没要求的结构。"
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    };

    if (state.aiSettings.apiKey) headers.Authorization = "Bearer " + state.aiSettings.apiKey;
    if (state.aiSettings.endpoint.indexOf("/") === 0) payload.provider = state.aiSettings.provider;

    return fetch(state.aiSettings.endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error("模型请求失败：" + response.status + " " + text.slice(0, 240));
          });
        }
        return response.json();
      })
      .then(function (data) {
        var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!content) throw new Error("模型没有返回可展示的内容。");
        return content;
      });
  }

  function setLoading(selector, isLoading, loadingText) {
    var button = $(selector);
    if (!button) return;
    if (isLoading) {
      button.setAttribute("data-original-text", button.textContent);
      button.textContent = loadingText;
      button.disabled = true;
      button.classList.add("loading");
    } else {
      button.textContent = button.getAttribute("data-original-text") || button.textContent;
      button.disabled = false;
      button.classList.remove("loading");
    }
  }

  function generateJdOutputs() {
    var meaningError = validateInput("meaning");
    var dayError = validateInput("day");
    var settingsError = validateAiSettings();
    var error = meaningError || dayError || settingsError;
    if (error) {
      setHtml("#meaningResult", '<div class="warning">' + escapeHtml(error) + "</div>");
      setHtml("#dayResult", '<div class="warning">' + escapeHtml(error) + "</div>");
      return;
    }

    setLoading("#generateJdBtn", true, "生成中...");
    setHtml("#meaningResult", '<div class="empty-state"><strong>正在生成</strong><p>使用 Prompt 1 分析 JD...</p></div>');
    setHtml("#dayResult", '<div class="empty-state"><strong>正在生成</strong><p>使用 Prompt 2 推测岗位日常...</p></div>');

    Promise.all([callModel(buildPrompt("meaning")), callModel(buildPrompt("day"))])
      .then(function (results) {
        setHtml("#meaningResult", renderGeneratedText(results[0], "meaning"));
        setHtml("#dayResult", renderGeneratedText(results[1], "day"));
      })
      .catch(function (modelError) {
        setHtml("#meaningResult", '<div class="warning">' + escapeHtml(modelError.message) + "</div>");
        setHtml("#dayResult", '<div class="warning">' + escapeHtml(modelError.message) + "</div>");
      })
      .then(function () {
        setLoading("#generateJdBtn", false);
      });
  }

  function generateResumeOutput() {
    var error = validateInput("resume") || validateAiSettings();
    if (error) {
      setHtml("#resumeResult", '<div class="warning">' + escapeHtml(error) + "</div>");
      return;
    }

    setLoading("#generateResumeBtn", true, "优化中...");
    setHtml("#resumeResult", '<div class="empty-state"><strong>正在优化</strong><p>使用 Prompt 3 结合当前 JD 和简历生成结果...</p></div>');

    callModel(buildPrompt("resume"))
      .then(function (text) {
        setHtml("#resumeResult", renderGeneratedText(text, "resume"));
      })
      .catch(function (modelError) {
        setHtml("#resumeResult", '<div class="warning">' + escapeHtml(modelError.message) + "</div>");
      })
      .then(function () {
        setLoading("#generateResumeBtn", false);
      });
  }

  function renderPromptEditor() {
    var prompt = state.prompts[state.selectedPrompt];
    if ($("#promptName")) $("#promptName").textContent = prompt.name;
    if ($("#variableBox")) $("#variableBox").textContent = prompt.variables.join("  ");
    if ($("#promptEditor")) $("#promptEditor").value = prompt.text;
    $all(".prompt-item").forEach(function (item) {
      item.classList.toggle("active", item.getAttribute("data-prompt") === state.selectedPrompt);
    });
  }

  function renderAiSettings() {
    if ($("#apiProvider")) $("#apiProvider").value = state.aiSettings.provider || "openai";
    if ($("#apiEndpoint")) $("#apiEndpoint").value = state.aiSettings.endpoint || "/api/generate";
    if ($("#apiModel")) $("#apiModel").value = state.aiSettings.model || "gpt-4o-mini";
    if ($("#apiKey")) $("#apiKey").value = state.aiSettings.apiKey || "";
  }

  function testPrompt() {
    var editor = $("#promptEditor");
    if (!editor) return;
    var prompt = state.prompts[state.selectedPrompt];
    var text = editor.value;
    var missing = [];
    for (var i = 0; i < prompt.variables.length; i += 1) {
      if (text.indexOf(prompt.variables[i]) === -1) missing.push(prompt.variables[i]);
    }
    if (missing.length) {
      setHtml("#promptTestResult", '<div class="warning">当前测试 Prompt 缺少必要变量：' + escapeHtml(missing.join("、")) + "</div>");
      return;
    }
    setHtml("#promptTestResult", '<h4>测试通过</h4><p>当前 Prompt 变量完整，正式生成时会按它执行。</p><div class="prompt-preview">' + escapeHtml(buildPrompt(state.selectedPrompt)) + "</div>");
  }

  function saveHistory() {
    var jd = ($("#jdInput") && $("#jdInput").value.trim()) || "";
    var output = ($("#resumeResult") && $("#resumeResult").innerText.trim()) || "";
    if (!jd || !output || output.indexOf("等待简历输入") !== -1) {
      setHtml("#resumeResult", '<div class="warning">请先生成简历优化结果，再保存历史。</div>');
      return;
    }
    var history = [];
    try {
      history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [];
    } catch (error) {
      history = [];
    }
    history.unshift({
      createdAt: new Date().toLocaleString("zh-CN"),
      jd: jd.slice(0, 180),
      output: output.slice(0, 260)
    });
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history.slice(0, 20)));
    renderHistory();
  }

  function renderHistory() {
    var history = [];
    try {
      history = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)) || [];
    } catch (error) {
      history = [];
    }
    if (!history.length) {
      setHtml("#historyList", '<div class="empty-state panel"><strong>还没有历史记录</strong><p>在工作台生成简历优化结果后，可以保存到这里。</p></div>');
      return;
    }
    var html = "";
    for (var i = 0; i < history.length; i += 1) {
      html += '<article class="history-item"><time>' + escapeHtml(history[i].createdAt) + "</time><p>" + escapeHtml(history[i].jd) + '...</p><p>' + escapeHtml(history[i].output) + "...</p></article>";
    }
    setHtml("#historyList", html);
  }

  function wireEvents() {
    $all(".nav-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var viewName = tab.getAttribute("data-view");
        $all(".nav-tab").forEach(function (item) { item.classList.remove("active"); });
        $all(".view").forEach(function (view) { view.classList.remove("active"); });
        tab.classList.add("active");
        var target = $("#" + viewName + "View");
        if (target) target.classList.add("active");
      });
    });

    $all(".result-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var resultName = tab.getAttribute("data-result");
        $all(".result-tab").forEach(function (item) { item.classList.remove("active"); });
        if ($("#meaningResult")) $("#meaningResult").classList.remove("active");
        if ($("#dayResult")) $("#dayResult").classList.remove("active");
        tab.classList.add("active");
        var target = $("#" + resultName + "Result");
        if (target) target.classList.add("active");
      });
    });

    $all(".prompt-item").forEach(function (item) {
      item.addEventListener("click", function () {
        if ($("#promptEditor")) state.prompts[state.selectedPrompt].text = $("#promptEditor").value;
        state.selectedPrompt = item.getAttribute("data-prompt");
        renderPromptEditor();
      });
    });

    on("#clearJdBtn", "click", function () { if ($("#jdInput")) $("#jdInput").value = ""; });
    on("#generateJdBtn", "click", generateJdOutputs);
    on("#generateResumeBtn", "click", generateResumeOutput);
    on("#savePromptBtn", "click", function () {
      if ($("#promptEditor")) state.prompts[state.selectedPrompt].text = $("#promptEditor").value;
      savePrompts();
    });
    on("#resetPromptBtn", "click", function () {
      state.prompts[state.selectedPrompt] = clone(DEFAULT_PROMPTS[state.selectedPrompt]);
      renderPromptEditor();
    });
    on("#testPromptBtn", "click", testPrompt);
    on("#apiProvider", "change", function () {
      var provider = $("#apiProvider").value;
      if ($("#apiModel")) $("#apiModel").value = PROVIDER_DEFAULT_MODELS[provider] || PROVIDER_DEFAULT_MODELS.custom;
    });
    on("#saveAiSettingsBtn", "click", function () {
      state.aiSettings.provider = ($("#apiProvider") && $("#apiProvider").value) || "openai";
      state.aiSettings.endpoint = ($("#apiEndpoint") && $("#apiEndpoint").value.trim()) || "/api/generate";
      state.aiSettings.model = ($("#apiModel") && $("#apiModel").value.trim()) || "gpt-4o-mini";
      state.aiSettings.apiKey = ($("#apiKey") && $("#apiKey").value.trim()) || "";
      saveAiSettings();
    });
    on("#clearAiSettingsBtn", "click", function () {
      state.aiSettings = clone(DEFAULT_AI_SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.aiSettings);
      renderAiSettings();
      setHtml("#aiSettingsStatus", '<div class="warning">模型设置已清空。重新填写并保存后才能真实生成。</div>');
    });
    on("#testAiSettingsBtn", "click", function () {
      state.aiSettings.provider = ($("#apiProvider") && $("#apiProvider").value) || "openai";
      state.aiSettings.endpoint = ($("#apiEndpoint") && $("#apiEndpoint").value.trim()) || "/api/generate";
      state.aiSettings.model = ($("#apiModel") && $("#apiModel").value.trim()) || "gpt-4o-mini";
      state.aiSettings.apiKey = ($("#apiKey") && $("#apiKey").value.trim()) || "";
      var error = validateAiSettings();
      if (error) {
        setHtml("#aiSettingsStatus", '<div class="warning">' + escapeHtml(error) + "</div>");
        return;
      }
      setHtml("#aiSettingsStatus", '<div class="empty-state"><strong>正在测试</strong><p>向模型发送一条短请求...</p></div>');
      callModel("请只回复四个字：连接成功")
        .then(function (text) { setHtml("#aiSettingsStatus", renderGeneratedText(text, "meaning")); })
        .catch(function (modelError) { setHtml("#aiSettingsStatus", '<div class="warning">' + escapeHtml(modelError.message) + "</div>"); });
    });
    on("#resumeFile", "change", function (event) {
      var file = event.target.files[0];
      if (!file) return;
      file.text().then(function (text) { if ($("#resumeInput")) $("#resumeInput").value = text; });
    });
    on("#copyResumeBtn", "click", function () {
      if (navigator.clipboard && $("#resumeResult")) navigator.clipboard.writeText($("#resumeResult").innerText);
    });
    on("#saveHistoryBtn", "click", saveHistory);
    on("#clearHistoryBtn", "click", function () {
      localStorage.removeItem(STORAGE_KEYS.history);
      renderHistory();
    });
  }

  try {
    wireEvents();
    renderPromptEditor();
    renderAiSettings();
    renderHistory();
    window.__findWorkLegacyReady = true;
  } catch (error) {
    document.body.insertAdjacentHTML("afterbegin", '<div class="warning" style="margin: 16px;">页面脚本初始化失败：' + escapeHtml(error.message) + "</div>");
  }
})();
