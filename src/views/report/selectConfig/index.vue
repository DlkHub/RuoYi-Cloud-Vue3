<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="报表" prop="reportId">
        <el-select v-model="queryParams.reportId" filterable clearable placeholder="请选择报表" style="width: 220px">
          <el-option v-for="item in reportOptions" :key="item.id" :label="item.reportCode" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="查询字段" prop="fieldName"><el-input v-model="queryParams.fieldName" placeholder="请输入查询字段名" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="显示名称" prop="fieldLabel"><el-input v-model="queryParams.fieldLabel" placeholder="请输入显示名称" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['report:queryItem:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['report:queryItem:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['report:queryItem:remove']">删除</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['report:queryItem:export']">导出</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="queryItemList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="表名称" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ getReportCode(scope.row.reportId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="查询字段" prop="fieldName" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="显示名称" prop="fieldLabel" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="组件类型" prop="componentType" width="120" align="center"><template #default="scope"><el-tag>{{ scope.row.componentType }}</el-tag></template></el-table-column>
      <el-table-column label="查询方式" prop="queryType" width="100" align="center" />
      <el-table-column label="输入提示" prop="placeholder" min-width="150" :show-overflow-tooltip="true" />
      <el-table-column label="默认值" prop="defaultValue" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="选项来源" prop="optionSource" width="110" align="center" />
      <el-table-column label="必填" prop="required" width="80" align="center"><template #default="scope"><el-tag :type="scope.row.required ? 'danger' : 'info'">{{ scope.row.required ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="显示" prop="visible" width="80" align="center"><template #default="scope"><el-tag :type="scope.row.visible ? 'success' : 'info'">{{ scope.row.visible ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="排序" prop="sort" width="80" align="center" />
      <el-table-column label="创建时间" prop="createTime" width="170" align="center"><template #default="scope"><span>{{ parseTime(scope.row.createTime) }}</span></template></el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right" class-name="small-padding fixed-width"><template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['report:queryItem:edit']">修改</el-button><el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['report:queryItem:remove']">删除</el-button></template></el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="open" :title="title" width="760px" append-to-body>
      <el-form ref="queryItemRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="报表" prop="reportId"><el-select v-model="form.reportId" filterable placeholder="请选择报表" class="full-width"><el-option v-for="item in reportOptions" :key="item.id" :label="item.reportCode" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="查询字段" prop="fieldName"><el-input v-model="form.fieldName" placeholder="如：userName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="显示名称" prop="fieldLabel"><el-input v-model="form.fieldLabel" placeholder="如：用户名" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="组件类型" prop="componentType"><el-select v-model="form.componentType" class="full-width"><el-option v-for="item in componentTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="查询方式" prop="queryType"><el-select v-model="form.queryType" class="full-width"><el-option v-for="item in queryTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="输入提示" prop="placeholder"><el-input v-model="form.placeholder" placeholder="如：请输入用户名" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="默认值" prop="defaultValue"><el-input v-model="form.defaultValue" placeholder="请输入默认值" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="选项来源" prop="optionSource"><el-select v-model="form.optionSource" clearable placeholder="无需选项" class="full-width"><el-option v-for="item in optionSourceOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="是否必填" prop="required"><el-radio-group v-model="form.required"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="是否显示" prop="visible"><el-radio-group v-model="form.visible"><el-radio :value="1">显示</el-radio><el-radio :value="0">隐藏</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="排序" prop="sort"><el-input-number v-model="form.sort" :min="0" controls-position="right" class="full-width" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="选项配置" prop="optionConfig"><el-input v-model="form.optionConfig" type="textarea" :rows="4" placeholder="静态选项示例：[{&quot;label&quot;:&quot;男&quot;,&quot;value&quot;:&quot;0&quot;}]；字典或接口配置请按后端约定填写 JSON" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="cancel">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="ReportSelectConfig">
import { addQueryItem, delQueryItem, getQueryItem, listQueryItem, updateQueryItem } from '@/api/report/queryItem'
import { listConfig } from '@/api/report/config'

const { proxy } = getCurrentInstance()
const route = useRoute()
const queryItemList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const open = ref(false)
const title = ref('')
const reportOptions = ref([])
const reportMap = ref({})
const componentTypeOptions = [
  { label: '文本输入框', value: 'input' }, { label: '下拉选择', value: 'select' }, { label: '日期', value: 'date' },
  { label: '日期范围', value: 'date_range' }, { label: '数字输入框', value: 'number' }, { label: '多选下拉', value: 'multi_select' }
]
const queryTypeOptions = [
  { label: '等于', value: 'eq' }, { label: '包含', value: 'like' }, { label: '大于', value: 'gt' }, { label: '大于等于', value: 'ge' },
  { label: '小于', value: 'lt' }, { label: '小于等于', value: 'le' }, { label: '范围', value: 'between' }, { label: '包含任一', value: 'in' }
]
const optionSourceOptions = [{ label: '静态选项', value: 'static' }, { label: '数据字典', value: 'dict' }, { label: '接口数据', value: 'api' }]
const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, reportId: route.query.reportId || route.params.reportId || undefined, fieldName: undefined, fieldLabel: undefined },
  rules: {
    reportId: [{ required: true, message: '报表不能为空', trigger: 'change' }],
    fieldName: [{ required: true, message: '查询字段名不能为空', trigger: 'blur' }, { max: 64, message: '查询字段名长度不能超过64个字符', trigger: 'blur' }],
    fieldLabel: [{ required: true, message: '显示名称不能为空', trigger: 'blur' }, { max: 128, message: '显示名称长度不能超过128个字符', trigger: 'blur' }],
    componentType: [{ required: true, message: '组件类型不能为空', trigger: 'change' }],
    queryType: [{ required: true, message: '查询方式不能为空', trigger: 'change' }],
    optionConfig: [{ validator: validateJson, trigger: 'blur' }]
  }
})
const { queryParams, form, rules } = toRefs(data)

/** 加载报表列表，构建 id->reportCode 映射 */
function loadReports() {
  listConfig({ pageNum: 1, pageSize: 1000 }).then(response => {
    const list = response.rows || []
    reportOptions.value = list
    const map = {}
    list.forEach(item => { map[item.id] = item.reportCode })
    reportMap.value = map
  })
}

/** 根据报表ID获取表名称(reportCode)，找不到则返回原ID */
function getReportCode(reportId) {
  return reportMap.value[reportId] || reportId
}

function validateJson(rule, value, callback) {
  if (!value) return callback()
  try { JSON.parse(value); callback() } catch { callback(new Error('选项配置必须是有效的 JSON 格式')) }
}
function getList() {
  loading.value = true
  listQueryItem(queryParams.value).then(response => { queryItemList.value = response.rows; total.value = response.total }).finally(() => { loading.value = false })
}
function reset() {
  form.value = { id: undefined, reportId: queryParams.value.reportId, fieldName: undefined, fieldLabel: undefined, componentType: 'input', queryType: 'eq', placeholder: undefined, defaultValue: undefined, optionSource: undefined, optionConfig: undefined, required: 0, visible: 1, sort: 0 }
  proxy.resetForm('queryItemRef')
}
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增报表查询条件' }
function handleUpdate(row) { reset(); getQueryItem(row?.id || ids.value[0]).then(response => { form.value = response.data; form.value.optionConfig = formatOptionConfig(form.value.optionConfig); open.value = true; title.value = '修改报表查询条件' }) }
function formatOptionConfig(value) { return value && typeof value === 'object' ? JSON.stringify(value, null, 2) : value }
function submitForm() {
  proxy.$refs.queryItemRef.validate(valid => {
    if (!valid) return
    const payload = { ...form.value }
    const request = payload.id ? updateQueryItem(payload) : addQueryItem(payload)
    request.then(() => { proxy.$modal.msgSuccess(payload.id ? '修改成功' : '新增成功'); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const queryItemIds = row?.id || ids.value
  proxy.$modal.confirm(`是否确认删除编号为"${queryItemIds}"的报表查询条件？`).then(() => delQueryItem(queryItemIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}
function handleExport() { proxy.download('report/queryItem/export', { ...queryParams.value }, `report_query_item_${new Date().getTime()}.xlsx`) }

loadReports()
getList()
</script>

<style scoped lang="scss">
.full-width { width: 100%; }
</style>
