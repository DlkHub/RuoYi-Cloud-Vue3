import request from '@/utils/request'

export function listColumnConfig(query) {
  return request({ url: '/report/columnConfig/list', method: 'get', params: query })
}

export function getColumnConfig(id) {
  return request({ url: '/report/columnConfig/' + id, method: 'get' })
}

export function addColumnConfig(data) {
  return request({ url: '/report/columnConfig', method: 'post', data })
}

export function updateColumnConfig(data) {
  return request({ url: '/report/columnConfig', method: 'put', data })
}

export function delColumnConfig(id) {
  return request({ url: '/report/columnConfig/' + id, method: 'delete' })
}
