<template>
  <div class="chat-container">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="chat-header-info">
        <el-avatar :size="40" class="ai-avatar">
          <el-icon><ChatDotRound /></el-icon>
        </el-avatar>
        <div>
          <div class="chat-title">AI 智能助手</div>
          <div class="chat-status">
            <el-tag size="small" type="success">在线</el-tag>
          </div>
        </div>
      </div>
      <div class="chat-header-actions">
        <el-button text icon="Delete" @click="handleClear">清空对话</el-button>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="chat-body" ref="chatBodyRef">
      <div class="welcome-card" v-if="messages.length === 0">
        <h2>你好，我是 AI 助手</h2>
        <p>有什么可以帮你的吗？试试下面的常见问题：</p>
        <div class="suggestions">
          <div class="suggestion-item" v-for="(item, idx) in suggestions" :key="idx" @click="handleSuggestion(item)">
            {{ item }}
          </div>
        </div>
      </div>

      <div v-for="(msg, idx) in messages" :key="idx" :class="['message-row', msg.role]">
        <el-avatar :size="36" class="msg-avatar">
          <el-icon v-if="msg.role === 'user'"><User /></el-icon>
          <el-icon v-else><ChatDotRound /></el-icon>
        </el-avatar>
        <div class="message-content">
          <div class="message-bubble" v-html="renderContent(msg.content)"></div>
          <div class="message-time">{{ msg.time }}</div>
        </div>
      </div>

      <!-- 加载指示器 -->
      <div class="message-row assistant" v-if="loading">
        <el-avatar :size="36" class="msg-avatar">
          <el-icon><ChatDotRound /></el-icon>
        </el-avatar>
        <div class="message-content">
          <div class="message-bubble loading">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-footer">
      <el-input
        v-model="inputText"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 8 }"
        placeholder="请输入你的问题，Enter 发送，Shift+Enter 换行"
        resize="none"
        @keydown.enter="handleEnter"
        :disabled="loading"
      />
      <el-button
        type="primary"
        :icon="Promotion"
        :loading="loading"
        @click="handleSend"
        :disabled="!inputText.trim()"
      >发送</el-button>
    </div>
  </div>
</template>

<script setup name="Ask">
import { ChatDotRound, User, Promotion } from '@element-plus/icons-vue'
import { askQuestion } from '@/api/agent/ask'

const { proxy } = getCurrentInstance()

const inputText = ref('')
const loading = ref(false)
const messages = ref([])
const chatBodyRef = ref(null)

const suggestions = [
  '你好，请介绍一下自己',
  '帮我写一个 Java Hello World',
  'Vue 3 有哪些新特性？',
  '如何使用 Spring Boot 创建 REST API？'
]

function renderContent(content) {
  return (content || '').replace(/\n/g, '<br>')
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  })
}

function handleEnter(e) {
  if (e.shiftKey) return
  e.preventDefault()
  handleSend()
}

function handleSuggestion(text) {
  inputText.value = text
  handleSend()
}

function getCurrentTime() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text, time: getCurrentTime() })
  inputText.value = ''
  loading.value = true
  scrollToBottom()

  try {
    const res = await askQuestion({ question: text, history: messages.value.slice(0, -1) })
    const answer = res.data.answer || res.msg || '未收到回复'
    messages.value.push({ role: 'assistant', content: answer, time: getCurrentTime() })
  } catch (err) {
    // 接口失败时使用本地模拟回复，便于前端独立调试
    messages.value.push({ role: 'assistant', content: generateMockReply(text), time: getCurrentTime() })
    proxy.$modal.msgWarning('AI 接口暂不可用，已使用本地模拟回复')
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

function generateMockReply(q) {
  return `收到你的问题："${q}"。\n\n这是一个演示用的回复。当后端 /agent/ask 接口就绪后，将返回真实 AI 回答。\n\n你可以：\n1. 在 src/api/agent/ask.js 中调整接口地址\n2. 移除本页 catch 中的 mock 逻辑`
}

function handleClear() {
  if (messages.value.length === 0) return
  proxy.$modal.confirm('确认清空当前对话？').then(() => {
    messages.value = []
  }).catch(() => {})
}
</script>

<style scoped lang="scss">
.chat-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  background: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;

  .chat-header-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ai-avatar {
    background: linear-gradient(135deg, #409eff, #67c23a);
  }

  .chat-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #c0c4cc;
    border-radius: 3px;
  }
}

.welcome-card {
  margin: auto;
  text-align: center;
  max-width: 600px;

  h2 {
    color: #303133;
    margin-bottom: 8px;
  }
  p {
    color: #909399;
    margin-bottom: 20px;
  }
  .suggestions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .suggestion-item {
    padding: 12px 16px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #606266;

    &:hover {
      border-color: #409eff;
      color: #409eff;
      background: #ecf5ff;
    }
  }
}

.message-row {
  display: flex;
  gap: 10px;
  max-width: 80%;

  &.user {
    margin-left: auto;
    flex-direction: row-reverse;

    .msg-avatar {
      background: #409eff;
    }
    .message-bubble {
      background: #409eff;
      color: #fff;
    }
  }

  &.assistant {
    .msg-avatar {
      background: linear-gradient(135deg, #67c23a, #409eff);
    }
    .message-bubble {
      background: #fff;
      color: #303133;
    }
  }

  .message-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &.user .message-content {
    align-items: flex-end;
  }

  .message-bubble {
    padding: 10px 14px;
    border-radius: 10px;
    line-height: 1.6;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

    &.loading {
      display: flex;
      gap: 4px;
      align-items: center;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #c0c4cc;
        animation: blink 1.4s infinite ease-in-out;

        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }
  }

  .message-time {
    font-size: 11px;
    color: #909399;
    padding: 0 4px;
  }
}

.chat-footer {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  :deep(.el-textarea__inner) {
    border-radius: 8px;
  }
}



@keyframes blink {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}
</style>
