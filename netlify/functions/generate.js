const PROVIDERS = {
  openai: {
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    defaultBaseUrl: "https://api.openai.com/v1/chat/completions",
  },
  deepseek: {
    apiKeyEnv: "DEEPSEEK_API_KEY",
    baseUrlEnv: "DEEPSEEK_BASE_URL",
    defaultBaseUrl: "https://api.deepseek.com/chat/completions",
  },
  qwen: {
    apiKeyEnv: "DASHSCOPE_API_KEY",
    baseUrlEnv: "DASHSCOPE_BASE_URL",
    defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  },
  moonshot: {
    apiKeyEnv: "MOONSHOT_API_KEY",
    baseUrlEnv: "MOONSHOT_BASE_URL",
    defaultBaseUrl: "https://api.moonshot.cn/v1/chat/completions",
  },
  zhipu: {
    apiKeyEnv: "ZHIPU_API_KEY",
    baseUrlEnv: "ZHIPU_BASE_URL",
    defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  },
  custom: {
    apiKeyEnv: "CUSTOM_API_KEY",
    baseUrlEnv: "CUSTOM_BASE_URL",
    defaultBaseUrl: "",
  },
};

function resolveProvider(providerName) {
  const provider = PROVIDERS[providerName || "openai"];
  if (!provider) {
    throw new Error(`Unsupported provider: ${providerName}`);
  }

  const apiKey = process.env[provider.apiKeyEnv];
  const baseUrl = process.env[provider.baseUrlEnv] || provider.defaultBaseUrl;

  if (!apiKey) {
    throw new Error(`Missing ${provider.apiKeyEnv} environment variable.`);
  }
  if (!baseUrl) {
    throw new Error(`Missing ${provider.baseUrlEnv} environment variable.`);
  }

  return { apiKey, baseUrl };
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Only POST is supported." }),
    };
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const { apiKey, baseUrl } = resolveProvider(payload.provider);
    const { provider, ...upstreamPayload } = payload;

    const upstream = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(upstreamPayload),
    });

    const text = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: {
        ...headers,
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
      body: text,
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Model request failed." }),
    };
  }
};
