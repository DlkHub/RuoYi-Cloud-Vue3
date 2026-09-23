import request from '@/utils/request'

export function listQueryItem(query) {
  return request({ url: '/report/queryItem/list', method: 'get', params: query })
}

export function getQueryItem(id) {
  return request({ url: '/report/queryItem/' + id, method: 'get' })
}

export function addQueryItem(data) {
  return request({ url: '/report/queryItem', method: 'post', data })
}

export function updateQueryItem(data) {
  return request({ url: '/report/queryItem', method: 'put', data })
}

export function delQueryItem(id) {
  return request({ url: '/report/queryItem/' + id, method: 'delete' })
}
