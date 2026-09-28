import request from '@/utils/request'

// 发送问题给 AI
export function askQuestion(data) {
  return request({
    url: '/agent/ai/ask',
    method: 'post',
    data: data
  })
}

// 清空指定会话的后端记忆
export function clearConversation(conversationId) {
  return request({
    url: `/agent/ai/memory/${conversationId}`,
    method: 'delete'
  })
}
