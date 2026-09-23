<template>
  <div class="app-container">
    <div class="report-selector">
      <span class="report-selector__label">选择报表</span>
      <el-select v-model="reportId" filterable clearable :loading="reportLoading" placeholder="请选择报表"
                 style="width: 280px" @change="handleReportChange">
        <el-option v-for="report in reportOptions" :key="report.id" :label="getReportLabel(report)" :value="report.id"/>
      </el-select>
    </div>

    <el-form v-if="reportId" ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="90px">
      <el-form-item v-for="field in visibleQueryItems" :key="field.id" :label="field.fieldLabel"
                    :prop="field.fieldName">
        <el-input v-if="field.componentType === 'input'" v-model="queryParams[field.fieldName]"
                  :placeholder="field.placeholder || `请输入${field.fieldLabel}`" clearable style="width: 220px"
                  @keyup.enter="handleQuery"/>
        <el-input-number v-else-if="field.componentType === 'number'" v-model="queryParams[field.fieldName]"
                         controls-position="right" :placeholder="field.placeholder || `请输入${field.fieldLabel}`"
                         style="width: 220px"/>
        <el-select v-else-if="field.componentType === 'select'" v-model="queryParams[field.fieldName]" clearable
                   :placeholder="field.placeholder || `请选择${field.fieldLabel}`" style="width: 220px">
          <el-option v-for="option in getOptions(field)" :key="String(option.value)" :label="option.label"
                     :value="option.value"/>
        </el-select>
        <el-select v-else-if="field.componentType === 'multi_select'" v-model="queryParams[field.fieldName]" multiple
                   collapse-tags clearable :placeholder="field.placeholder || `请选择${field.fieldLabel}`"
                   style="width: 220px">
          <el-option v-for="option in getOptions(field)" :key="String(option.value)" :label="option.label"
                     :value="option.value"/>
        </el-select>
        <el-date-picker v-else-if="field.componentType === 'date'" v-model="queryParams[field.fieldName]" type="date"
                        value-format="YYYY-MM-DD" :placeholder="field.placeholder || `请选择${field.fieldLabel}`"
                        style="width: 220px"/>
        <el-date-picker v-else-if="field.componentType === 'date_range'" v-model="queryParams[field.fieldName]"
                        type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期"
                        end-placeholder="结束日期" style="width: 260px"/>
        <el-input v-else v-model="queryParams[field.fieldName]"
                  :placeholder="field.placeholder || `请输入${field.fieldLabel}`" clearable style="width: 220px"
                  @keyup.enter="handleQuery"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row v-if="reportId" :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" :columns="toolbarColumns" :storage-key="`reportCustom_${reportId}`"
                     @queryTable="getList"/>
    </el-row>

    <div :style="{ width: tableWidth ? tableWidth + 'px' : '100%', overflowX: 'auto' }">
      <el-table v-loading="loading" :data="dataList" border>
        <el-table-column v-for="column in visibleColumns" :key="column.id" :label="column.fieldLabel"
                         :prop="column.fieldName" :align="column.align || 'left'"
                         :fixed="column.fixed || false" :sortable="column.sortable ? 'custom' : false"
                         :show-overflow-tooltip="true">
          <template #default="scope"><span>{{ formatValue(scope.row[column.fieldName], column) }}</span></template>
        </el-table-column>
      </el-table>
    </div>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
                v-model:limit="queryParams.pageSize" @pagination="getList"/>
  </div>
</template>

<script setup name="ReportCustom">
import request from '@/utils/request'
import {getDicts} from '@/api/system/dict/data'
import {listColumnConfig} from '@/api/report/columnConfig'
import {listQueryItem} from '@/api/report/queryItem'
import {listReportData, listReports} from '@/api/report/custom'
import {forEach} from "vuedraggable/dist/vuedraggable.common.js";

const {proxy} = getCurrentInstance()
const reportId = ref()
const reportOptions = ref([])
const reportLoading = ref(false)
const queryItems = ref([])
const columnConfigs = ref([])
const optionMap = reactive({})
const dataList = ref([])
const total = ref(0)
const loading = ref(false)
const showSearch = ref(true)
const tableWidth = ref(0)
const queryParams = reactive({pageNum: 1, pageSize: 10, reportId: reportId.value})

const visibleQueryItems = computed(() => queryItems.value.filter(item => item.visible === 1 || item.visible === '1'))
const toolbarColumns = ref({})
const visibleColumns = computed(() => columnConfigs.value.filter(item => toolbarColumns.value[item.fieldName]?.visible !== false))

function parseConfig(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function getOptions(field) {
  return optionMap[field.id] || []
}

function normalizeOptions(options, config = {}) {
  const valueKey = config.valueKey || 'value'
  const labelKey = config.labelKey || 'label'
  return (options || []).map(item => ({value: item[valueKey], label: item[labelKey]}))
}

async function loadOptions(field) {
  const config = parseConfig(field.optionConfig)
  if (field.optionSource === 'static') optionMap[field.id] = Array.isArray(config) ? normalizeOptions(config) : []
  if (field.optionSource === 'dict') {
    const dictType = typeof config === 'string' ? config : config?.dictType
    if (!dictType) return
    const response = await getDicts(dictType)
    optionMap[field.id] = response.data.map(item => ({value: item.dictValue, label: item.dictLabel}))
  }
  if (field.optionSource === 'api' && config?.url) {
    const response = await request({url: config.url, method: config.method || 'get', params: config.params || {}})
    const rows = config.dataKey ? config.dataKey.split('.').reduce((value, key) => value?.[key], response) : (response.data || response.rows || [])
    optionMap[field.id] = normalizeOptions(rows, config)
  }
}

function parseDefaultValue(field) {
  if (field.defaultValue === null || field.defaultValue === undefined || field.defaultValue === '') return undefined
  if (field.componentType === 'multi_select' || field.componentType === 'date_range') {
    try {
      return JSON.parse(field.defaultValue)
    } catch {
      return field.defaultValue.split(',')
    }
  }
  return field.defaultValue
}

async function loadConfig() {
  if (!reportId.value) return
  loading.value = true
  try {
    const [queryResponse, columnResponse] = await Promise.all([
      listQueryItem({reportId: reportId.value, pageNum: 1, pageSize: 1000}),
      listColumnConfig({reportId: reportId.value, pageNum: 1, pageSize: 1000})
    ])
    queryItems.value = (queryResponse.rows || []).sort((a, b) => a.sort - b.sort)
    columnConfigs.value = (columnResponse.rows || []).sort((a, b) => a.sort - b.sort)
    toolbarColumns.value = Object.fromEntries(columnConfigs.value.map(item => [item.fieldName, {
      label: item.fieldLabel,
      visible: item.visible === 1 || item.visible === '1'
    }]))
    queryItems.value.forEach(field => {
      queryParams[field.fieldName] = parseDefaultValue(field)
    })
    await Promise.all(queryItems.value.filter(field => field.optionSource).map(loadOptions))
    getList()
    // setTableWidth(columnConfigs)
  } finally {
    loading.value = false
  }
}
function setTableWidth(columns) {
  const cols = columns.value || columns
  tableWidth.value = cols.reduce((total, col) => total + (Number(col.width) || 0), 0)
}
async function loadReports() {
  reportLoading.value = true
  try {
    const response = await listReports({pageNum: 1, pageSize: 1000})
    reportOptions.value = response.rows || response.data || []
  } finally {
    reportLoading.value = false
  }
}

function getReportLabel(report) {
  return `${report.reportName || report.name || report.title || '未命名报表'}（ID: ${report.id}）`
}

function handleReportChange() {
  dataList.value = []
  total.value = 0
  queryItems.value = []
  columnConfigs.value = []
  toolbarColumns.value = {}
  Object.keys(queryParams).forEach(key => {
    if (!['pageNum', 'pageSize', 'reportId'].includes(key)) delete queryParams[key]
  })
  queryParams.reportId = reportId.value
  if (reportId.value) loadConfig()
}

function getList() {
  loading.value = true
  listReportData(queryParams).then(response => {
    dataList.value = response.rows || [];
    total.value = response.total || 0
  }).finally(() => {
    loading.value = false
  })
}

function handleQuery() {
  queryParams.pageNum = 1;
  getList()
}

function resetQuery() {
  proxy.resetForm('queryRef')
  queryItems.value.forEach(field => {
    queryParams[field.fieldName] = parseDefaultValue(field)
  })
  handleQuery()
}

function formatValue(value, column) {
  if (value === null || value === undefined || value === '') return ''
  if (column.fieldType === 'currency') return Number(value).toLocaleString('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  })
  if (column.fieldType === 'percent') return `${Number(value)}%`
  if (column.fieldType === 'date') return proxy.parseTime(value, '{y}-{m}-{d}')
  if (column.fieldType === 'datetime') return proxy.parseTime(value)
  return value
}

function handleExport() {
  proxy.download('report/custom/export', {...queryParams}, `report_${reportId.value}_${new Date().getTime()}.xlsx`)
}

loadReports()
</script>

<style scoped lang="scss">
.report-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.report-selector__label {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
</style>
