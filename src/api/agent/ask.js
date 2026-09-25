import request from '@/utils/request'

// 发送问题给 AI
export function askQuestion(data) {
  return request({
    url: '/agent/ai/ask',
    method: 'post',
    data: data
  })
}
