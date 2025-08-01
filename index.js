const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');
const iconv = require('iconv-lite');
const chardet = require('chardet');

// 将 exec 转为 Promise 形式
const execPromise = util.promisify(exec);

// 配置 API
const API_KEY = process.env.API_KEY || 'your-api-key';
const API_URL = process.env.API_URL || 'http://localhost:11434/api/chat';

// 命令白名单（针对 Windows 优化）
const ALLOWED_COMMANDS = ['dir', 'type', 'echo', 'findstr', 'find', 'cd', 'whoami'];

// 系统提示（优化以支持中文和明确逻辑）
const SYSTEM_PROMPT = `
你是一个智能 AI 代理，旨在通过处理用户查询并在必要时协调外部工具提供帮助。任务包括：

1. 分析用户查询，判断是否可直接回答或需调用工具。
2. 如果需要工具，返回 JSON 格式的工具调用指令：
   {
     "tool": "tool_name",
     "parameters": { ... }
   }
3. 如果任务未完成，返回中间指令或继续调用工具。
4. 如果任务完成，返回纯文本答案，格式为 "FINAL_ANSWER: 答案"。
5. 确保正确处理中文字符，特别是在文件路径或内容中。

可用工具：
- weather_api: 获取城市天气数据。参数: { "city": "city_name" }
- browser_query: 从 Web API 查询数据。参数: { "url": "api_url", "query_params": { "key": "value" } }
- execute_command: 执行本地命令行。参数: { "command": "command_name", "args": ["arg1", "arg2"] }
  - 仅限以下命令: ${ALLOWED_COMMANDS.join(', ')}
  - 示例: {"tool": "execute_command", "parameters": {"command": "dir", "args": []}}
  - 对于 dir 命令，工具会返回简化的文件和目录列表。

回复要求：
- 简洁明了，确保中文正确显示。
- 仅使用允许的命令，避免破坏性操作。
- 如果任务需要解析工具输出（如 dir），直接生成简洁的 FINAL_ANSWER。

示例：
查询: "列出当前目录下的所有文件"
工具调用: {"tool": "execute_command", "parameters": {"command": "dir", "args": []}}
工具结果: {"status": "success", "data": "index.js, package.json, 测试文件.txt"}
最终答案: FINAL_ANSWER: 当前目录下的文件: index.js, package.json, 测试文件.txt
`;

// 工具定义
const TOOLS = {
  weather_api: async (parameters) => {
    const { city } = parameters;
    try {
      // 替换为真实天气 API（如 OpenWeatherMap）
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=your-weather-api-key`);
      return {
        status: 'success',
        data: response.data || { temperature: 25, humidity: 60, condition: 'Sunny' }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to fetch weather for ${city}: ${error.message}`
      };
    }
  },
  browser_query: async (parameters) => {
    const { url, query_params } = parameters;
    try {
      const params = new URLSearchParams(query_params || {}).toString();
      const fullUrl = params ? `${url}?${params}` : url;
      console.log(`Querying browser data from: ${fullUrl}`);
      const response = await axios.get(fullUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });
      return {
        status: 'success',
        data: response.data
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Failed to query browser data from ${url}: ${error.message}`
      };
    }
  },
  execute_command: async (parameters) => {
    const { command, args = [] } = parameters;
    try {
      if (!ALLOWED_COMMANDS.includes(command)) {
        return {
          status: 'error',
          message: `Command "${command}" is not allowed. Allowed: ${ALLOWED_COMMANDS.join(', ')}`
        };
      }

      // 处理中文参数，移除危险字符
      const sanitizedArgs = args.map(arg => arg.replace(/[<>|&;]/g, ''));
      const fullCommand = process.platform === 'win32'
        ? `chcp 65001 >nul && ${command} ${sanitizedArgs.join(' ')}`.trim()
        : `${command} ${sanitizedArgs.join(' ')}`.trim();
      console.log(`Executing command: ${fullCommand}`);

      // 执行命令，捕获 Buffer 输出
      const { stdout, stderr } = await execPromise(fullCommand, { encoding: 'buffer', maxBuffer: 1024 * 1024 });

      // 动态检测编码，尝试多种编码
      const possibleEncodings = [chardet.detect(stdout), 'gbk', 'utf8', 'gb2312'];
      let decodedStdout = '';
      let decodedStderr = '';
      let selectedEncoding = '';
      for (const encoding of possibleEncodings.filter(e => e)) {
        try {
          decodedStdout = iconv.decode(stdout, encoding);
          decodedStderr = iconv.decode(stderr, encoding);
          if (!decodedStdout.includes('�') && decodedStdout.trim()) {
            selectedEncoding = encoding;
            break;
          }
        } catch (e) {
          console.log(`Failed to decode with ${encoding}: ${e.message}`);
        }
      }
      console.log(`Selected encoding: ${selectedEncoding || 'none'}`);

      if (decodedStderr) {
        return { status: 'error', message: `Command failed: ${decodedStderr}` };
      }

      // 解析 dir 输出
      if (command === 'dir') {
        const lines = decodedStdout.split('\n').map(line => line.trim());
        const filesAndDirs = lines
          .filter(line => line.match(/^\d{4}\/\d{2}\/\d{2}/))
          .map(line => line.split(/\s+/).pop())
          .filter(name => name !== '.' && name !== '..');
        return {
          status: 'success',
          data: filesAndDirs.join(', ')
        };
      }

      return { status: 'success', data: decodedStdout };
    } catch (error) {
      return { status: 'error', message: `Failed to execute command "${command}": ${error.message}` };
    }
  }
};

// 调用 LLM（适配 Ollama API）
async function callLLM(messages) {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: 'qwen3:8b',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false, // 禁用流式响应，确保完整 JSON
        think:false
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // 适配 Ollama API 响应格式
    const content = response.data.message?.content || response.data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid LLM response format');
    }

    console.log(`LLM Raw Response: ${JSON.stringify(response.data)}`);
    console.log(`LLM Output: ${content}`);
    return content;
  } catch (error) {
    throw new Error(`LLM call failed: ${error.message}`);
  }
}

// 解析 LLM 输出
function parseLLMOutput(output) {
  try {
    // 匹配 JSON 对象
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.tool && parsed.parameters) {
        return { type: 'tool_call', tool: parsed.tool, parameters: parsed.parameters };
      }
    }
    if (output.startsWith('FINAL_ANSWER')) {
      return { type: 'final_answer', content: output.replace('FINAL_ANSWER', '').trim() };
    }
    return { type: 'intermediate', content: output };
  } catch (error) {
    console.log(`Failed to parse LLM output: ${error.message}`);
    return { type: 'intermediate', content: output };
  }
}

// 主 Agent 流程
async function runAgent(query, maxIterations = 5) {
  let context = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: query }
  ];
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;
    console.log(`Iteration ${iteration}: Calling LLM...`, JSON.stringify(context, null, 2));
    const llmOutput = await callLLM(context);

    const parsedOutput = parseLLMOutput(llmOutput);
    console.log(`Parsed LLM Output: ${JSON.stringify(parsedOutput)}`);

    if (parsedOutput.type === 'final_answer') {
      return parsedOutput.content;
    } else if (parsedOutput.type === 'tool_call') {
      const { tool, parameters } = parsedOutput;
      if (TOOLS[tool]) {
        console.log(`Calling tool: ${tool} with parameters: ${JSON.stringify(parameters)}`);
        const toolResult = await TOOLS[tool](parameters);
        console.log(`Tool Result: ${JSON.stringify(toolResult)}`);

        context.push(
          { role: 'assistant', content: llmOutput },
          { role: 'user', content: `Tool result: ${JSON.stringify(toolResult)}` }
        );
      } else {
        context.push(
          { role: 'assistant', content: llmOutput },
          { role: 'user', content: `Error: Tool ${tool} not found.` }
        );
      }
    } else {
      context.push(
        { role: 'assistant', content: llmOutput },
        { role: 'user', content: '请继续处理任务。' }
      );
    }
  }

  throw new Error('Max iterations reached without a final answer.');
}

// 示例运行
async function main() {
  try {
    const query = '获取网站http://WWW.BAIDU.COM 的内容';
    const result = await runAgent(query);
    console.log(`Final Result: ${result}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAgent };