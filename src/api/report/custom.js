import request from '@/utils/request'

// 查询可用报表列表，用于自定义报表页的报表选择器
export function listReports(query) {
  return request({
    url: '/report/config/list',
    method: 'get',
    params: query
  })
}


// 查询报表数据
export function listReportData(query) {
  return request({
    url: '/report/config/custom/data',
    method: 'get',
    params: query
  })
}
