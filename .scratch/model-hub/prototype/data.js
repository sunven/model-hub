window.PROTOTYPE_DATA = {
  "generatedAt": "2026-10-26",
  "models": [
    {
      "id": "anthropic/claude-opus-5-5",
      "name": "Claude Opus 5.5",
      "lab": "Anthropic",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-09-22",
      "context": 1000000,
      "outputLimit": 128000,
      "reasoning": "low / medium / high / xhigh / max",
      "price": {
        "inputMin": 4,
        "inputMax": 4,
        "outputMin": 20,
        "outputMax": 20
      },
      "offers": [
        {
          "provider": "Anthropic",
          "providerKey": "anthropic",
          "providerModelId": "claude-opus-5-5",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 4,
          "output": 20,
          "cacheRead": 0.2,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "global.anthropic.claude-opus-5-5",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 4,
          "output": 20,
          "cacheRead": 0.2,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "anthropic/claude-opus-5.5",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 4,
          "output": 20,
          "cacheRead": 0.2,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Cortecs",
          "providerKey": "cortecs",
          "providerModelId": "claude-opus-5.5",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 4.399,
          "output": 21.998,
          "cacheRead": 0.219,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high"
        }
      ],
      "arena": {
        "text": {
          "model_name": "Claude Opus 5.5 (High)",
          "organization": "anthropic",
          "rating": 1516.2,
          "ci_low": 1509.4,
          "ci_high": 1523.0,
          "rank": 2,
          "votes": 10322,
          "condition": "High",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "Claude Opus 5.5 (Max)",
          "organization": "anthropic",
          "rating": 1806.9,
          "ci_low": 1793.6,
          "ci_high": 1820.3,
          "rank": 1,
          "votes": 3140,
          "condition": "Max",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": "2026-06",
      "attachment": true,
      "temperature": false,
      "interleaved": false
    },
    {
      "id": "anthropic/claude-sonnet-5-5",
      "name": "Claude Sonnet 5.5",
      "lab": "Anthropic",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-09-28",
      "context": 1000000,
      "outputLimit": 128000,
      "reasoning": "low / medium / high / xhigh / max",
      "price": {
        "inputMin": 2,
        "inputMax": 2,
        "outputMin": 10,
        "outputMax": 10
      },
      "offers": [
        {
          "provider": "Anthropic",
          "providerKey": "anthropic",
          "providerModelId": "claude-sonnet-5-5",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 2,
          "output": 10,
          "cacheRead": 0.1,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "anthropic.claude-sonnet-5-5",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 2,
          "output": 10,
          "cacheRead": 0.1,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "anthropic/claude-sonnet-5.5",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 2,
          "output": 10,
          "cacheRead": 0.1,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Cortecs",
          "providerKey": "cortecs",
          "providerModelId": "claude-sonnet-5.5",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 2.25,
          "output": 11.249,
          "cacheRead": 0.225,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high"
        }
      ],
      "arena": {
        "text": {
          "model_name": "Claude Sonnet 5.5 (xHigh)",
          "organization": "anthropic",
          "rating": 1473.1,
          "ci_low": 1466.1,
          "ci_high": 1480.1,
          "rank": 28,
          "votes": 8977,
          "condition": "xHigh",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "Claude Sonnet 5.5 (High)",
          "organization": "anthropic",
          "rating": 1709.2,
          "ci_low": 1699.6,
          "ci_high": 1718.8,
          "rank": 7,
          "votes": 5632,
          "condition": "High",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": "2026-06",
      "attachment": true,
      "temperature": false,
      "interleaved": false
    },
    {
      "id": "anthropic/claude-haiku-5-5",
      "name": "Claude Haiku 5.5",
      "lab": "Anthropic",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-10-07",
      "context": 1000000,
      "outputLimit": 128000,
      "reasoning": "开关 + low / medium / high / xhigh / max",
      "price": {
        "inputMin": 0.1,
        "inputMax": 0.11,
        "outputMin": 0.5,
        "outputMax": 0.55
      },
      "offers": [
        {
          "provider": "Anthropic",
          "providerKey": "anthropic",
          "providerModelId": "claude-haiku-5-5",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 0.1,
          "output": 0.5,
          "cacheRead": 0.01,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "开关 + low / medium / high / xhigh / max"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "au.anthropic.claude-haiku-5-5",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 0.11,
          "output": 0.55,
          "cacheRead": 0.011,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "开关 + low / medium / high / xhigh / max"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "anthropic/claude-haiku-5.5",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 0.1,
          "output": 0.5,
          "cacheRead": 0.01,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "none / low / medium / high / xhigh / max"
        },
        {
          "provider": "Cortecs",
          "providerKey": "cortecs",
          "providerModelId": "claude-haiku-5.5",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 0.113,
          "output": 0.563,
          "cacheRead": 0.011,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high"
        }
      ],
      "arena": {
        "text": null,
        "webdev": {
          "model_name": "Claude Haiku 5.5 (High)",
          "organization": "anthropic",
          "rating": 1585.6,
          "ci_low": 1575.2,
          "ci_high": 1596.1,
          "rank": 35,
          "votes": 3917,
          "condition": "High",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": "2026-06",
      "attachment": true,
      "temperature": false,
      "interleaved": false
    },
    {
      "id": "openai/gpt-6.1-sol",
      "name": "GPT-6.1 Sol",
      "lab": "OpenAI",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-09-29",
      "context": 1050000,
      "outputLimit": 128000,
      "reasoning": "low / medium / high / xhigh / max",
      "price": {
        "inputMin": 2,
        "inputMax": 2.2,
        "outputMin": 10,
        "outputMax": 11
      },
      "offers": [
        {
          "provider": "OpenAI",
          "providerKey": "openai",
          "providerModelId": "gpt-6.1-sol",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 2,
          "output": 10,
          "cacheRead": 0.1,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "us.openai.gpt-6.1-sol",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 2.2,
          "output": 11,
          "cacheRead": 0.11,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "openai/gpt-6.1-sol",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 2,
          "output": 10,
          "cacheRead": 0.1,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Cortecs",
          "providerKey": "cortecs",
          "providerModelId": "gpt-6.1-sol",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 2.4,
          "output": 11.999,
          "cacheRead": 0.12,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high"
        }
      ],
      "arena": {
        "text": {
          "model_name": "GPT-6.1 Sol (Max)",
          "organization": "openai",
          "rating": 1444.1,
          "ci_low": 1436.8,
          "ci_high": 1451.3,
          "rank": 66,
          "votes": 8305,
          "condition": "Max",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "GPT-6.1 Sol (Max)",
          "organization": "openai",
          "rating": 1749.3,
          "ci_low": 1737.1,
          "ci_high": 1761.6,
          "rank": 4,
          "votes": 3469,
          "condition": "Max",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": "2026-04-30",
      "attachment": true,
      "temperature": false,
      "interleaved": false
    },
    {
      "id": "openai/gpt-6-astra",
      "name": "GPT-6 Astra",
      "lab": "OpenAI",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-09-04",
      "context": 1050000,
      "outputLimit": 128000,
      "reasoning": "low / medium / high / xhigh / max",
      "price": {
        "inputMin": 10,
        "inputMax": 11,
        "outputMin": 50,
        "outputMax": 55
      },
      "offers": [
        {
          "provider": "OpenAI",
          "providerKey": "openai",
          "providerModelId": "gpt-6-astra",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 10,
          "output": 50,
          "cacheRead": 1,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "us.openai.gpt-6-astra",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 11,
          "output": 55,
          "cacheRead": 1.1,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "openai/gpt-6-astra",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 10,
          "output": 50,
          "cacheRead": 1,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Cortecs",
          "providerKey": "cortecs",
          "providerModelId": "gpt-6-astra",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 12.272,
          "output": 61.359,
          "cacheRead": 1.228,
          "context": 1050000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high"
        }
      ],
      "arena": {
        "text": {
          "model_name": "GPT-6 Astra (Max)",
          "organization": "openai",
          "rating": 1442.0,
          "ci_low": 1436.0,
          "ci_high": 1448.1,
          "rank": 73,
          "votes": 14076,
          "condition": "Max",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "GPT-6 Astra (Max)",
          "organization": "openai",
          "rating": 1774.3,
          "ci_low": 1764.4,
          "ci_high": 1784.2,
          "rank": 2,
          "votes": 6579,
          "condition": "Max",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": "2026-04-30",
      "attachment": true,
      "temperature": false,
      "interleaved": false
    },
    {
      "id": "google/gemini-3.8-flash",
      "name": "Gemini 3.8 Flash",
      "lab": "Google",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-09-02",
      "context": 1048576,
      "outputLimit": 65536,
      "reasoning": "low / medium / high",
      "price": {
        "inputMin": 0.75,
        "inputMax": 0.75,
        "outputMin": 3.75,
        "outputMax": 3.75
      },
      "offers": [
        {
          "provider": "Google",
          "providerKey": "google",
          "providerModelId": "gemini-3.8-flash",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 0.75,
          "output": 3.75,
          "cacheRead": 0.075,
          "context": 1048576,
          "outputLimit": 65536,
          "reasoning": "low / medium / high"
        },
        {
          "provider": "Google Vertex",
          "providerKey": "google-vertex",
          "providerModelId": "gemini-3.8-flash",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 0.75,
          "output": 3.75,
          "cacheRead": 0.075,
          "context": 1048576,
          "outputLimit": 65536,
          "reasoning": "low / medium / high"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "google/gemini-3.8-flash",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 0.825,
          "output": 4.125,
          "cacheRead": 0.0825,
          "context": 1048576,
          "outputLimit": 65536,
          "reasoning": "low / medium / high"
        },
        {
          "provider": "Cortecs",
          "providerKey": "cortecs",
          "providerModelId": "gemini-3.8-flash",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 0.825,
          "output": 4.125,
          "cacheRead": 0.082,
          "context": 1048576,
          "outputLimit": 65535,
          "reasoning": "low / medium / high"
        }
      ],
      "arena": {
        "text": {
          "model_name": "Gemini 3.8 Flash (High)",
          "organization": "google",
          "rating": 1498.3,
          "ci_low": 1493.8,
          "ci_high": 1502.8,
          "rank": 8,
          "votes": 43997,
          "condition": "High",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "Gemini 3.8 Flash (High)",
          "organization": "google",
          "rating": 1584.9,
          "ci_low": 1577.7,
          "ci_high": 1592.2,
          "rank": 36,
          "votes": 11405,
          "condition": "High",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "video",
          "audio",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": null,
      "attachment": true,
      "temperature": true,
      "interleaved": false
    },
    {
      "id": "alibaba/qwen3.8-max",
      "name": "Qwen3.8 Max",
      "lab": "Alibaba / Qwen",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-08-03",
      "context": 1000000,
      "outputLimit": 131072,
      "reasoning": "开关 + low / medium / xhigh + 预算 0–262144",
      "price": {
        "inputMin": 1.77744,
        "inputMax": 2,
        "outputMin": 5.33231,
        "outputMax": 6
      },
      "offers": [
        {
          "provider": "Alibaba",
          "providerKey": "alibaba",
          "providerModelId": "qwen3.8-max",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 2,
          "output": 6,
          "cacheRead": 0.25,
          "context": 1000000,
          "outputLimit": 131072,
          "reasoning": "开关 + low / medium / xhigh + 预算 0–262144"
        },
        {
          "provider": "Alibaba (China)",
          "providerKey": "alibaba-cn",
          "providerModelId": "qwen3.8-max",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 1.77744,
          "output": 5.33231,
          "cacheRead": 0.22218,
          "context": 1000000,
          "outputLimit": 131072,
          "reasoning": "开关 + low / medium / xhigh + 预算 0–262144"
        },
        {
          "provider": "Deep Infra",
          "providerKey": "deepinfra",
          "providerModelId": "Qwen/Qwen3.8-Max",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 1.65,
          "output": 4.951,
          "cacheRead": 0.206,
          "context": 256000,
          "outputLimit": 131072,
          "reasoning": "不支持"
        },
        {
          "provider": "OpenCode",
          "providerKey": "opencode",
          "providerModelId": "qwen3.8-max",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 2,
          "output": 6,
          "cacheRead": 0.25,
          "context": 262144,
          "outputLimit": 131072,
          "reasoning": "开关 + low / medium / xhigh + 预算 ≥1024"
        }
      ],
      "arena": {
        "text": {
          "model_name": "Qwen3.8-Max",
          "organization": "alibaba",
          "rating": 1483.6,
          "ci_low": 1478.8,
          "ci_high": 1488.4,
          "rank": 15,
          "votes": 30500,
          "condition": "default",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "Qwen3.8-Max",
          "organization": "alibaba",
          "rating": 1672.2,
          "ci_low": 1660.2,
          "ci_high": 1684.3,
          "rank": 13,
          "votes": 3429,
          "condition": "default",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "video",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": null,
      "attachment": true,
      "temperature": true,
      "interleaved": true
    },
    {
      "id": "moonshotai/kimi-k3",
      "name": "Kimi K3",
      "lab": "Moonshot / Kimi",
      "status": "beta / mixed",
      "openWeights": true,
      "releaseDate": "2026-07-16",
      "context": 1048576,
      "outputLimit": 1048576,
      "reasoning": "low / high / max",
      "price": {
        "inputMin": 3,
        "inputMax": 3,
        "outputMin": 15,
        "outputMax": 15
      },
      "offers": [
        {
          "provider": "Moonshot AI",
          "providerKey": "moonshotai",
          "providerModelId": "kimi-k3",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 3,
          "output": 15,
          "cacheRead": 0.3,
          "context": 1048576,
          "outputLimit": 1048576,
          "reasoning": "low / high / max"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "global.moonshotai.kimi-k3",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 3,
          "output": 15,
          "cacheRead": 0.3,
          "context": 1048576,
          "outputLimit": 128000,
          "reasoning": "支持，未标档位"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "moonshotai/kimi-k3",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 0.152,
          "output": 20,
          "cacheRead": 0.142,
          "context": 1048576,
          "outputLimit": 943718,
          "reasoning": "none / low / high / max"
        },
        {
          "provider": "Pioneer",
          "providerKey": "pioneer",
          "providerModelId": "moonshotai/Kimi-K3",
          "kind": "gateway",
          "status": "deprecated",
          "input": 3,
          "output": 15,
          "cacheRead": 0.3,
          "context": 1000000,
          "outputLimit": 131072,
          "reasoning": "low / high / max"
        }
      ],
      "arena": {
        "text": {
          "model_name": "Kimi K3 (Max)",
          "organization": "moonshot",
          "rating": 1475.0,
          "ci_low": 1470.6,
          "ci_high": 1479.5,
          "rank": 25,
          "votes": 35379,
          "condition": "Max",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "Kimi K3 (Max)",
          "organization": "moonshot",
          "rating": 1654.9,
          "ci_low": 1648.9,
          "ci_high": 1660.8,
          "rank": 17,
          "votes": 20312,
          "condition": "Max",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "video"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": null,
      "attachment": true,
      "temperature": false,
      "interleaved": true
    },
    {
      "id": "zhipuai/glm-5.3",
      "name": "GLM 5.3",
      "lab": "Zhipu / GLM",
      "status": "beta",
      "openWeights": true,
      "releaseDate": "2026-08-14",
      "context": 1000000,
      "outputLimit": 131072,
      "reasoning": "low / high / max",
      "price": {
        "inputMin": 1.19516,
        "inputMax": 1.68,
        "outputMin": 4.18306,
        "outputMax": 5.28
      },
      "offers": [
        {
          "provider": "Zhipu AI",
          "providerKey": "zhipuai",
          "providerModelId": "glm-5.3",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 1.19516,
          "output": 4.18306,
          "cacheRead": 0.29879,
          "context": 1000000,
          "outputLimit": 131072,
          "reasoning": "low / high / max"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "global.zai.glm-5.3",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 1.68,
          "output": 5.28,
          "cacheRead": 0.312,
          "context": 1000000,
          "outputLimit": 128000,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "z-ai/glm-5.3",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 0.0699,
          "output": 1.4,
          "cacheRead": 0.0689,
          "context": 1048576,
          "outputLimit": 943718,
          "reasoning": "low / high / max"
        },
        {
          "provider": "Cortecs",
          "providerKey": "cortecs",
          "providerModelId": "glm-5.3",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 0.511,
          "output": 2.045,
          "cacheRead": 0.154,
          "context": 1048576,
          "outputLimit": 1048576,
          "reasoning": "low / high / max"
        }
      ],
      "arena": {
        "text": {
          "model_name": "GLM-5.3 (Max)",
          "organization": "zai",
          "rating": 1473.9,
          "ci_low": 1468.9,
          "ci_high": 1478.9,
          "rank": 27,
          "votes": 25144,
          "condition": "Max",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "GLM-5.3 (Max)",
          "organization": "zai",
          "rating": 1622.8,
          "ci_low": 1615.4,
          "ci_high": 1630.2,
          "rank": 25,
          "votes": 10315,
          "condition": "Max",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": null,
      "attachment": false,
      "temperature": true,
      "interleaved": true
    },
    {
      "id": "meta/muse-wonder-1.0",
      "name": "Muse Wonder",
      "lab": "Meta",
      "status": "stable",
      "openWeights": false,
      "releaseDate": "2026-10-12",
      "context": 1048576,
      "outputLimit": 131072,
      "reasoning": "minimal / low / medium / high / xhigh / max",
      "price": {
        "inputMin": 4,
        "inputMax": 4,
        "outputMin": 20,
        "outputMax": 20
      },
      "offers": [
        {
          "provider": "Meta",
          "providerKey": "meta",
          "providerModelId": "muse-wonder-1.0",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 4,
          "output": 20,
          "cacheRead": 0.2,
          "context": 1048576,
          "outputLimit": 131072,
          "reasoning": "minimal / low / medium / high / xhigh / max"
        },
        {
          "provider": "OpenCode",
          "providerKey": "opencode",
          "providerModelId": "muse-wonder-1.0",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 4,
          "output": 20,
          "cacheRead": 0.2,
          "context": 1048576,
          "outputLimit": 131072,
          "reasoning": "minimal / low / medium / high / xhigh / max"
        },
        {
          "provider": "CommandCode",
          "providerKey": "commandcode",
          "providerModelId": "meta/muse-wonder-1.0",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 4,
          "output": 20,
          "cacheRead": 0.2,
          "context": 1048576,
          "outputLimit": 131072,
          "reasoning": "low / medium / high / xhigh / max"
        },
        {
          "provider": "Cloudflare AI Gateway",
          "providerKey": "cloudflare-ai-gateway",
          "providerModelId": "meta/muse-wonder-1.0",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 4,
          "output": 20,
          "cacheRead": 0.2,
          "context": 1048576,
          "outputLimit": 131072,
          "reasoning": "minimal / low / medium / high / xhigh / max"
        }
      ],
      "arena": {
        "text": {
          "model_name": "Muse Wonder (Max)",
          "organization": "meta",
          "rating": 1500.5,
          "ci_low": 1492.5,
          "ci_high": 1508.6,
          "rank": 7,
          "votes": 6001,
          "condition": "Max",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "Muse Wonder (Max)",
          "organization": "meta",
          "rating": 1651.0,
          "ci_low": 1638.3,
          "ci_high": 1663.6,
          "rank": 18,
          "votes": 2733,
          "condition": "Max",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "video",
          "pdf",
          "audio"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": null,
      "attachment": true,
      "temperature": true,
      "interleaved": false
    },
    {
      "id": "xai/grok-4.7",
      "name": "Grok 4.7",
      "lab": "xAI",
      "status": "beta",
      "openWeights": false,
      "releaseDate": "2026-09-21",
      "context": 500000,
      "outputLimit": 500000,
      "reasoning": "low / medium / high / xhigh",
      "price": {
        "inputMin": 2,
        "inputMax": 2.2,
        "outputMin": 6,
        "outputMax": 6.6
      },
      "offers": [
        {
          "provider": "xAI",
          "providerKey": "xai",
          "providerModelId": "grok-4.7",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 2,
          "output": 6,
          "cacheRead": 0.5,
          "context": 500000,
          "outputLimit": 500000,
          "reasoning": "low / medium / high / xhigh"
        },
        {
          "provider": "Amazon Bedrock",
          "providerKey": "amazon-bedrock",
          "providerModelId": "us.xai.grok-4.7",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 2.2,
          "output": 6.6,
          "cacheRead": 0.55,
          "context": 500000,
          "outputLimit": 500000,
          "reasoning": "low / medium / high / xhigh"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "x-ai/grok-4.7",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 2,
          "output": 6,
          "cacheRead": 0.5,
          "context": 500000,
          "outputLimit": 450000,
          "reasoning": "low / medium / high / xhigh"
        },
        {
          "provider": "Ofox",
          "providerKey": "ofox",
          "providerModelId": "x-ai/grok-4.7",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 2,
          "output": 6,
          "cacheRead": 0.5,
          "context": 500000,
          "outputLimit": 65536,
          "reasoning": "low / medium / high / xhigh"
        }
      ],
      "arena": {
        "text": null,
        "webdev": {
          "model_name": "Grok 4.7 (xHigh)",
          "organization": "xai",
          "rating": 1637.9,
          "ci_low": 1628.7,
          "ci_high": 1647.2,
          "rank": 19,
          "votes": 5725,
          "condition": "xHigh",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text",
          "image",
          "pdf"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": "2026-05",
      "attachment": true,
      "temperature": true,
      "interleaved": false
    },
    {
      "id": "deepseek/deepseek-v4-pro-0813",
      "name": "DeepSeek V4 Pro 0813",
      "lab": "DeepSeek",
      "status": "beta / mixed",
      "openWeights": true,
      "releaseDate": "2026-08-13",
      "context": 1048576,
      "outputLimit": 393216,
      "reasoning": "开关 + low / high / max",
      "price": {
        "inputMin": 0.66,
        "inputMax": 1.3359,
        "outputMin": 1.98,
        "outputMax": 4.00771
      },
      "offers": [
        {
          "provider": "DeepSeek",
          "providerKey": "deepseek",
          "providerModelId": "deepseek-v4-pro",
          "kind": "first_party",
          "status": "available_unmarked",
          "input": 0.66,
          "output": 1.98,
          "cacheRead": 0.022,
          "context": 1048576,
          "outputLimit": 393216,
          "reasoning": "开关 + low / high / max"
        },
        {
          "provider": "Volcengine Ark",
          "providerKey": "volcengine",
          "providerModelId": "deepseek-v4-pro-ga-260813",
          "kind": "cloud",
          "status": "available_unmarked",
          "input": 1.3359,
          "output": 4.00771,
          "cacheRead": 0.04453,
          "context": 1000000,
          "outputLimit": 384000,
          "reasoning": "开关 + minimal / low / medium / high"
        },
        {
          "provider": "OpenRouter",
          "providerKey": "openrouter",
          "providerModelId": "deepseek/deepseek-v4-pro-0813",
          "kind": "gateway",
          "status": "available_unmarked",
          "input": 1.32,
          "output": 3.96,
          "cacheRead": 0.044,
          "context": 1048576,
          "outputLimit": 393216,
          "reasoning": "none / low / high / max"
        },
        {
          "provider": "RunInfra",
          "providerKey": "runinfra",
          "providerModelId": "deepseek-ai/DeepSeek-V4-Pro-0813",
          "kind": "gateway",
          "status": "deprecated",
          "input": 0.6,
          "output": 1.9,
          "cacheRead": 0.03,
          "context": 1048576,
          "outputLimit": 32768,
          "reasoning": "开关"
        }
      ],
      "arena": {
        "text": {
          "model_name": "DeepSeek-V4-Pro (High, 20260813)",
          "organization": "deepseek",
          "rating": 1445.6,
          "ci_low": 1439.0,
          "ci_high": 1452.1,
          "rank": 60,
          "votes": 9797,
          "condition": "High",
          "date": "2026-10-22",
          "category": "overall"
        },
        "webdev": {
          "model_name": "DeepSeek-V4-Pro (High, 20260813)",
          "organization": "deepseek",
          "rating": 1582.3,
          "ci_low": 1572.8,
          "ci_high": 1591.7,
          "rank": 37,
          "votes": 4714,
          "condition": "High",
          "date": "2026-10-23",
          "category": "webdev"
        }
      },
      "aaUrl": "https://artificialanalysis.ai/leaderboards/models",
      "source": "models.dev 2026-10-26 · Arena HF latest",
      "modalities": {
        "input": [
          "text"
        ],
        "output": [
          "text"
        ]
      },
      "toolCall": true,
      "structuredOutput": true,
      "knowledge": null,
      "attachment": false,
      "temperature": true,
      "interleaved": true
    }
  ],
  "unmatched": [
    {
      "board": "text",
      "model_name": "Gemini 4 Argon (High)",
      "organization": "google",
      "rating": 1525.7,
      "ci_low": 1519.2,
      "ci_high": 1532.3,
      "rank": 1,
      "votes": 10083,
      "condition": "High",
      "date": "2026-10-22"
    },
    {
      "board": "webdev",
      "model_name": "Gemini 4 Argon (High)",
      "organization": "google",
      "rating": 1674.2,
      "ci_low": 1661.5,
      "ci_high": 1686.8,
      "rank": 11,
      "votes": 2729,
      "condition": "High",
      "date": "2026-10-23"
    }
  ],
  "notes": [
    "models.dev 2026-10-26 快照；Arena HF latest，text=category overall、webdev=category webdev",
    "webdev/latest 含多个 category，原型只取 webdev；正式管道需去重多日期行",
    "价格单位 USD / 1M tokens；缺失为 null"
  ]
};
