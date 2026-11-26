<script setup>
import { ref, nextTick, onMounted, onUnmounted, computed } from 'vue';
import apiClient from '../../services/api';

// ─── State ───────────────────────────────────────────────────────────────────
const messages = ref([]);
const inputMessage = ref('');
const isLoading = ref(false);
const chatContainer = ref(null);
const inputRef = ref(null);

// Tạo sessionId duy nhất cho mỗi tab/lần mở trang
const sessionId = ref('');

onMounted(() => {
  sessionId.value = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Tin nhắn chào mừng từ AI
  messages.value.push({
    role: 'assistant',
    content: `Xin chào! 👋 Tôi là **Trợ lý Luật Giao Thông** — AI hỗ trợ bạn ôn thi sát hạch GPLX.

Tôi có thể giúp bạn về:
- 🚦 **Luật giao thông đường bộ** Việt Nam
- 🪧 **Biển báo giao thông** — ý nghĩa, phân loại
- 💰 **Mức xử phạt** vi phạm giao thông
- 📝 **Câu hỏi thi GPLX** — giải thích đáp án
- 🚗 **Kỹ năng lái xe** an toàn

Hãy đặt câu hỏi cho tôi nhé! 🎯`,
    timestamp: new Date()
  });

  // Focus vào ô nhập
  nextTick(() => {
    if (inputRef.value) inputRef.value.focus();
  });
});

// ─── Gợi ý câu hỏi nhanh ─────────────────────────────────────────────────────
const quickQuestions = [
  { icon: '🪧', text: 'Biển báo P.102 có ý nghĩa gì?' },
  { icon: '💰', text: 'Vượt đèn đỏ bị phạt bao nhiêu tiền?' },
  { icon: '🚗', text: 'Thi bằng lái B2 gồm những phần nào?' },
  { icon: '⚠️', text: 'Câu hỏi điểm liệt là gì?' },
];

const showQuickQuestions = computed(() => messages.value.length <= 1 && !isLoading.value);

// ─── Gửi tin nhắn ─────────────────────────────────────────────────────────────
async function handleSend() {
  const text = inputMessage.value.trim();
  if (!text || isLoading.value) return;

  // Thêm tin nhắn người dùng
  messages.value.push({
    role: 'user',
    content: text,
    timestamp: new Date()
  });

  inputMessage.value = '';
  isLoading.value = true;
  scrollToBottom();

  try {
    const response = await apiClient.post('/chatbot/send', {
      message: text,
      sessionId: sessionId.value
    });

    messages.value.push({
      role: 'assistant',
      content: response.data.reply,
      timestamp: new Date()
    });
  } catch (err) {
    messages.value.push({
      role: 'assistant',
      content: `⚠️ ${err.message || 'Có lỗi xảy ra. Vui lòng thử lại.'}`,
      isError: true,
      timestamp: new Date()
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
    nextTick(() => {
      if (inputRef.value) inputRef.value.focus();
    });
  }
}

// Gửi câu hỏi nhanh
function handleQuickQuestion(question) {
  inputMessage.value = question;
  handleSend();
}

// ─── Cuộn xuống cuối chat ─────────────────────────────────────────────────────
function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
}

// ─── Xóa lịch sử & bắt đầu mới ──────────────────────────────────────────────
async function handleClearChat() {
  try {
    await apiClient.post('/chatbot/clear', { sessionId: sessionId.value });
  } catch (_) { /* bỏ qua lỗi */ }

  // Tạo session mới
  sessionId.value = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  messages.value = [{
    role: 'assistant',
    content: 'Cuộc trò chuyện đã được làm mới! 🔄 Hãy đặt câu hỏi mới cho tôi nhé.',
    timestamp: new Date()
  }];

  nextTick(() => {
    if (inputRef.value) inputRef.value.focus();
  });
}

// ─── Enter để gửi, Shift+Enter để xuống dòng ─────────────────────────────────
function handleKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

// ─── Format thời gian ─────────────────────────────────────────────────────────
function formatTime(date) {
  return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// ─── Simple Markdown parser (bold, italic, lists, code) ───────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks ```
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-dark text-light rounded-2 p-2 my-1 small"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-light text-danger px-1 rounded-1 small">$1</code>')
    // Bold **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic *text*
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers ### → h6, ## → h5
    .replace(/^### (.+)$/gm, '<h6 class="fw-bold mt-2 mb-1">$1</h6>')
    .replace(/^## (.+)$/gm, '<h5 class="fw-bold mt-2 mb-1">$1</h5>')
    // Unordered list items - item
    .replace(/^- (.+)$/gm, '<li class="ms-3">$1</li>')
    // Numbered list items 1. item
    .replace(/^\d+\. (.+)$/gm, '<li class="ms-3">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li><br>?)+)/g, (match) => {
    return '<ul class="mb-1 ps-2">' + match.replace(/<br>/g, '') + '</ul>';
  });

  return html;
}
</script>

<template>
  <div class="chatbot-page">
    <!-- Breadcrumb -->
    <div class="container py-3">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mb-0 small">
          <li class="breadcrumb-item">
            <router-link to="/" class="text-decoration-none text-muted">
              <i class="bi bi-house-door me-1"></i>Trang chủ
            </router-link>
          </li>
          <li class="breadcrumb-item text-muted">Tra cứu</li>
          <li class="breadcrumb-item active fw-semibold" aria-current="page">Hỏi đáp AI</li>
        </ol>
      </nav>
    </div>

    <!-- Main Chat Container -->
    <div class="container pb-4">
      <div class="row justify-content-center">
        <div class="col-lg-9 col-xl-8">
          <div class="chat-wrapper">

            <!-- Header -->
            <div class="chat-header d-flex align-items-center justify-content-between">
              <div class="d-flex align-items-center gap-3">
                <div class="ai-avatar">
                  <i class="bi bi-robot"></i>
                </div>
                <div>
                  <h5 class="mb-0 fw-bold text-white">Trợ lý Luật Giao Thông</h5>
                  <div class="d-flex align-items-center gap-2">
                    <span class="status-dot bg-success"></span>
                    <small class="text-white-50">Powered by Groq</small>
                  </div>
                </div>
              </div>
              <button
                @click="handleClearChat"
                class="btn btn-outline-light btn-sm rounded-pill px-3"
                title="Cuộc trò chuyện mới"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>Làm mới
              </button>
            </div>

            <!-- Chat Messages -->
            <div class="chat-messages" ref="chatContainer">

              <!-- Quick Questions -->
              <div v-if="showQuickQuestions" class="quick-questions mt-3">
                <p class="text-muted text-center small mb-3">
                  <i class="bi bi-lightning-charge me-1"></i>Hoặc chọn câu hỏi gợi ý:
                </p>
                <div class="d-flex flex-wrap justify-content-center gap-2">
                  <button
                    v-for="(q, idx) in quickQuestions"
                    :key="idx"
                    @click="handleQuickQuestion(q.text)"
                    class="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 quick-btn"
                  >
                    <span class="me-1">{{ q.icon }}</span> {{ q.text }}
                  </button>
                </div>
              </div>

              <!-- Message Bubbles -->
              <div
                v-for="(msg, idx) in messages"
                :key="idx"
                class="message-row"
                :class="{ 'message-user': msg.role === 'user', 'message-assistant': msg.role === 'assistant' }"
              >
                <!-- Avatar -->
                <div class="message-avatar" v-if="msg.role === 'assistant'">
                  <div class="avatar-circle avatar-ai">
                    <i class="bi bi-robot"></i>
                  </div>
                </div>

                <!-- Bubble -->
                <div class="message-bubble" :class="{ 'bubble-error': msg.isError }">
                  <div v-if="msg.role === 'assistant'" v-html="renderMarkdown(msg.content)"></div>
                  <div v-else class="user-text">{{ msg.content }}</div>
                  <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                </div>

                <!-- User Avatar -->
                <div class="message-avatar" v-if="msg.role === 'user'">
                  <div class="avatar-circle avatar-user">
                    <i class="bi bi-person-fill"></i>
                  </div>
                </div>
              </div>

              <!-- Typing indicator -->
              <div v-if="isLoading" class="message-row message-assistant">
                <div class="message-avatar">
                  <div class="avatar-circle avatar-ai">
                    <i class="bi bi-robot"></i>
                  </div>
                </div>
                <div class="message-bubble typing-bubble">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="chat-input">
              <div class="input-wrapper">
                <textarea
                  ref="inputRef"
                  v-model="inputMessage"
                  @keydown="handleKeydown"
                  class="form-control chat-textarea"
                  placeholder="Nhập câu hỏi về luật giao thông..."
                  rows="1"
                  :disabled="isLoading"
                  maxlength="2000"
                ></textarea>
                <button
                  @click="handleSend"
                  class="btn btn-primary btn-send"
                  :disabled="!inputMessage.trim() || isLoading"
                  title="Gửi (Enter)"
                >
                  <i class="bi" :class="isLoading ? 'bi-hourglass-split spin' : 'bi-send-fill'"></i>
                </button>
              </div>
              <div class="input-hint d-flex justify-content-between">
                <small class="text-muted">
                  <kbd>Enter</kbd> gửi · <kbd>Shift+Enter</kbd> xuống dòng
                </small>
                <small class="text-muted">{{ inputMessage.length }}/2000</small>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chatbot-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #f5f3ff 100%);
}

/* ─── Chat Wrapper ─────────────────────────────────────────────────────────── */
.chat-wrapper {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 140px);
  min-height: 500px;
}

/* ─── Header ───────────────────────────────────────────────────────────────── */
.chat-header {
  background: linear-gradient(135deg, #1a56db 0%, #1e40af 50%, #3730a3 100%);
  padding: 18px 24px;
  flex-shrink: 0;
}

.ai-avatar {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  backdrop-filter: blur(10px);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ─── Messages Area ────────────────────────────────────────────────────────── */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

/* ─── Message Row ──────────────────────────────────────────────────────────── */
.message-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 85%;
  animation: fadeInUp 0.3s ease;
}

.message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-assistant {
  align-self: flex-start;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ─── Avatar ───────────────────────────────────────────────────────────────── */
.message-avatar {
  flex-shrink: 0;
}

.avatar-circle {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.avatar-ai {
  background: linear-gradient(135deg, #1a56db, #3730a3);
  color: white;
}

.avatar-user {
  background: linear-gradient(135deg, #059669, #10b981);
  color: white;
}

/* ─── Bubble ───────────────────────────────────────────────────────────────── */
.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  line-height: 1.6;
  font-size: 14.5px;
  position: relative;
  word-break: break-word;
}

.message-assistant .message-bubble {
  background: #f3f4f6;
  color: #1f2937;
  border-bottom-left-radius: 4px;
}

.message-user .message-bubble {
  background: linear-gradient(135deg, #1a56db, #2563eb);
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble-error {
  background: #fef2f2 !important;
  color: #dc2626 !important;
  border: 1px solid #fecaca;
}

.message-time {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 4px;
  text-align: right;
}

.user-text {
  white-space: pre-wrap;
}

/* ─── Typing Indicator ────────────────────────────────────────────────────── */
.typing-bubble {
  padding: 16px 20px !important;
}

.typing-indicator {
  display: flex;
  gap: 5px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typingBounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

/* ─── Quick Questions ──────────────────────────────────────────────────────── */
.quick-questions {
  padding: 0 10px;
}

.quick-btn {
  font-size: 13px;
  transition: all 0.2s ease;
  border-color: #bfdbfe;
  color: #1e40af;
}

.quick-btn:hover {
  background: #1a56db;
  border-color: #1a56db;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(26, 86, 219, 0.3);
}

/* ─── Input Area ───────────────────────────────────────────────────────────── */
.chat-input {
  padding: 16px 24px 12px;
  border-top: 1px solid #e5e7eb;
  background: #fafbfc;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 6px 6px 6px 16px;
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: #1a56db;
  box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.1);
}

.chat-textarea {
  border: none;
  resize: none;
  padding: 8px 0;
  font-size: 15px;
  max-height: 120px;
  line-height: 1.5;
  background: transparent;
}

.chat-textarea:focus {
  outline: none;
  box-shadow: none;
}

.btn-send {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  transition: all 0.2s ease;
}

.btn-send:not(:disabled):hover {
  transform: scale(1.05);
}

.btn-send:disabled {
  opacity: 0.4;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.input-hint {
  padding: 6px 4px 0;
}

.input-hint kbd {
  background: #e5e7eb;
  border: none;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 4px;
  color: #6b7280;
}

/* ─── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .chat-wrapper {
    border-radius: 0;
    height: calc(100vh - 80px);
  }

  .chat-header {
    padding: 14px 16px;
  }

  .ai-avatar {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }

  .chat-header h5 {
    font-size: 16px;
  }

  .chat-messages {
    padding: 16px;
  }

  .message-row {
    max-width: 92%;
  }

  .chat-input {
    padding: 12px 16px 8px;
  }

  .quick-btn {
    font-size: 12px;
  }
}

/* ─── Markdown content styling ─────────────────────────────────────────────── */
.message-assistant .message-bubble :deep(strong) {
  color: #1e40af;
}

.message-assistant .message-bubble :deep(ul) {
  list-style: none;
  padding-left: 0;
}

.message-assistant .message-bubble :deep(li) {
  padding: 2px 0;
}

.message-assistant .message-bubble :deep(li::before) {
  content: '';
}

.message-assistant .message-bubble :deep(h5),
.message-assistant .message-bubble :deep(h6) {
  color: #1e40af;
}

.message-assistant .message-bubble :deep(pre) {
  font-size: 12px;
  max-width: 100%;
  overflow-x: auto;
}
</style>
