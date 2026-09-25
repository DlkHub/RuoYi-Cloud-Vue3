<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch">
      <el-form-item label="报表" prop="reportId">
        <el-select v-model="queryParams.reportId" filterable clearable placeholder="请选择报表" style="width: 220px">
          <el-option v-for="item in reportOptions" :key="item.id" :label="item.reportCode" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="字段名" prop="fieldName"><el-input v-model="queryParams.fieldName" placeholder="请输入字段名" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item label="字段标题" prop="fieldLabel"><el-input v-model="queryParams.fieldLabel" placeholder="请输入字段标题" clearable @keyup.enter="handleQuery" /></el-form-item>
      <el-form-item><el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button><el-button icon="Refresh" @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['report:columnConfig:add']">新增</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['report:columnConfig:edit']">修改</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['report:columnConfig:remove']">删除</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['report:columnConfig:export']">导出</el-button></el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="columnConfigList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="表名称" min-width="160" :show-overflow-tooltip="true">
        <template #default="scope">
          <span>{{ getReportCode(scope.row.reportId) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="字段名" prop="fieldName" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="字段标题" prop="fieldLabel" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="字段类型" prop="fieldType" width="100" align="center"><template #default="scope"><el-tag>{{ scope.row.fieldType }}</el-tag></template></el-table-column>
      <el-table-column label="列宽" prop="width" width="90" align="center" />
      <el-table-column label="对齐方式" prop="align" width="100" align="center" />
      <el-table-column label="格式化" prop="formatter" width="110" align="center" />
      <el-table-column label="字典类型" prop="dictType" min-width="120" :show-overflow-tooltip="true" />
      <el-table-column label="可排序" prop="sortable" width="90" align="center"><template #default="scope"><el-tag :type="scope.row.sortable ? 'success' : 'info'">{{ scope.row.sortable ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="显示" prop="visible" width="80" align="center"><template #default="scope"><el-tag :type="scope.row.visible ? 'success' : 'info'">{{ scope.row.visible ? '是' : '否' }}</el-tag></template></el-table-column>
      <el-table-column label="固定列" prop="fixed" width="90" align="center" />
      <el-table-column label="排序" prop="sort" width="80" align="center" />
      <el-table-column label="创建时间" prop="createTime" width="170" align="center"><template #default="scope"><span>{{ parseTime(scope.row.createTime) }}</span></template></el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right" class-name="small-padding fixed-width"><template #default="scope"><el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['report:columnConfig:edit']">修改</el-button><el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['report:columnConfig:remove']">删除</el-button></template></el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="open" :title="title" width="680px" append-to-body>
      <el-form ref="columnConfigRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="报表" prop="reportId"><el-select v-model="form.reportId" filterable placeholder="请选择报表" class="full-width"><el-option v-for="item in reportOptions" :key="item.id" :label="item.reportCode" :value="item.id" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="字段名" prop="fieldName"><el-input v-model="form.fieldName" placeholder="如：userName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="字段标题" prop="fieldLabel"><el-input v-model="form.fieldLabel" placeholder="如：用户名" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="字段类型" prop="fieldType"><el-select v-model="form.fieldType" class="full-width"><el-option v-for="item in fieldTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="列宽" prop="width"><el-input-number v-model="form.width" :min="1" :max="2000" controls-position="right" class="full-width" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="对齐方式" prop="align"><el-radio-group v-model="form.align"><el-radio value="left">左对齐</el-radio><el-radio value="center">居中</el-radio><el-radio value="right">右对齐</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="格式化类型" prop="formatter"><el-input v-model="form.formatter" placeholder="如：yyyy-MM-dd" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="字典类型" prop="dictType"><el-input v-model="form.dictType" placeholder="如：sys_user_sex" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="是否排序" prop="sortable"><el-radio-group v-model="form.sortable"><el-radio :value="1">是</el-radio><el-radio :value="0">否</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="是否显示" prop="visible"><el-radio-group v-model="form.visible"><el-radio :value="1">显示</el-radio><el-radio :value="0">隐藏</el-radio></el-radio-group></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="固定列" prop="fixed"><el-select v-model="form.fixed" clearable placeholder="不固定" class="full-width"><el-option label="左侧" value="left" /><el-option label="右侧" value="right" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="字段顺序" prop="sort"><el-input-number v-model="form.sort" :min="0" controls-position="right" class="full-width" /></el-form-item></el-col>
        </el-row>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">确 定</el-button><el-button @click="cancel">取 消</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup name="ReportColumnConfig">
import { addColumnConfig, delColumnConfig, getColumnConfig, listColumnConfig, updateColumnConfig } from '@/api/report/columnConfig'
import { listConfig } from '@/api/report/config'

const { proxy } = getCurrentInstance()
const route = useRoute()
const columnConfigList = ref([])
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
const fieldTypeOptions = [
  { label: '文本', value: 'string' }, { label: '数字', value: 'number' }, { label: '日期', value: 'date' },
  { label: '日期时间', value: 'datetime' }, { label: '金额', value: 'currency' }, { label: '百分比', value: 'percent' }
]
const data = reactive({
  form: {},
  queryParams: { pageNum: 1, pageSize: 10, reportId: route.query.reportId || route.params.reportId || undefined, fieldName: undefined, fieldLabel: undefined },
  rules: {
    reportId: [{ required: true, message: '报表不能为空', trigger: 'change' }],
    fieldName: [{ required: true, message: '字段名不能为空', trigger: 'blur' }, { max: 64, message: '字段名长度不能超过64个字符', trigger: 'blur' }],
    fieldLabel: [{ required: true, message: '字段标题不能为空', trigger: 'blur' }, { max: 128, message: '字段标题长度不能超过128个字符', trigger: 'blur' }]
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

function getList() {
  loading.value = true
  listColumnConfig(queryParams.value).then(response => { columnConfigList.value = response.rows; total.value = response.total }).finally(() => { loading.value = false })
}
function reset() {
  form.value = { id: undefined, reportId: queryParams.value.reportId, fieldName: undefined, fieldLabel: undefined, fieldType: 'string', width: undefined, align: 'left', formatter: undefined, dictType: undefined, sortable: 0, visible: 1, fixed: undefined, sort: 0 }
  proxy.resetForm('columnConfigRef')
}
function cancel() { open.value = false; reset() }
function handleQuery() { queryParams.value.pageNum = 1; getList() }
function resetQuery() { proxy.resetForm('queryRef'); handleQuery() }
function handleSelectionChange(selection) { ids.value = selection.map(item => item.id); single.value = selection.length !== 1; multiple.value = !selection.length }
function handleAdd() { reset(); open.value = true; title.value = '新增报表列设置' }
function handleUpdate(row) { reset(); getColumnConfig(row?.id || ids.value[0]).then(response => { form.value = response.data; open.value = true; title.value = '修改报表列设置' }) }
function submitForm() {
  proxy.$refs.columnConfigRef.validate(valid => {
    if (!valid) return
    const request = form.value.id ? updateColumnConfig(form.value) : addColumnConfig(form.value)
    request.then(() => { proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功'); open.value = false; getList() })
  })
}
function handleDelete(row) {
  const columnIds = row?.id || ids.value
  proxy.$modal.confirm(`是否确认删除编号为"${columnIds}"的报表列设置？`).then(() => delColumnConfig(columnIds)).then(() => { getList(); proxy.$modal.msgSuccess('删除成功') }).catch(() => {})
}
function handleExport() { proxy.download('report/columnConfig/export', { ...queryParams.value }, `report_column_config_${new Date().getTime()}.xlsx`) }

loadReports()
getList()
</script>

<style scoped lang="scss">
.full-width { width: 100%; }
</style>
