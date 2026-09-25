import request from '@/utils/request'

// 查询报表配置列表
export function listConfig(query) {
  return request({ url: '/report/config/list', method: 'get', params: query })
}

// 查询报表配置详细
export function getConfig(id) {
  return request({ url: '/report/config/' + id, method: 'get' })
}

// 新增报表配置
export function addConfig(data) {
  return request({ url: '/report/config', method: 'post', data })
}

// 修改报表配置
export function updateConfig(data) {
  return request({ url: '/report/config', method: 'put', data })
}

// 删除报表配置
export function delConfig(id) {
  return request({ url: '/report/config/' + id, method: 'delete' })
}
