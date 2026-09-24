<template>
  <div class="app-container">
    <el-form ref="queryRef" :model="queryParams" :inline="true" v-show="showSearch" label-width="80px">
      <el-form-item label="报表编码" prop="reportCode">
        <el-input v-model="queryParams.reportCode" placeholder="请输入报表编码" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="报表名称" prop="reportName">
        <el-input v-model="queryParams.reportName" placeholder="请输入报表名称" clearable style="width: 220px" @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 180px">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['report:config:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['report:config:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['report:config:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['report:config:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="configList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" prop="id" width="80" align="center" />
      <el-table-column label="报表编码" prop="reportCode" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="报表名称" prop="reportName" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="描述" prop="description" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column label="数据表" prop="dataSource" min-width="140" :show-overflow-tooltip="true" />
      <el-table-column label="查询接口" prop="queryApi" min-width="160" :show-overflow-tooltip="true" />
      <el-table-column label="状态" prop="status" width="90" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="80" align="center" />
      <el-table-column label="创建时间" prop="createTime" width="170" align="center">
        <template #default="scope"><span>{{ parseTime(scope.row.createTime) }}</span></template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center" fixed="right" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['report:config:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['report:config:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />

    <el-dialog v-model="open" :title="title" width="680px" append-to-body>
      <el-form ref="configRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表编码" prop="reportCode">
              <el-input v-model="form.reportCode" placeholder="请输入报表编码" :disabled="form.id != null" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报表名称" prop="reportName">
              <el-input v-model="form.reportName" placeholder="请输入报表名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据表" prop="dataSource">
              <el-input v-model="form.dataSource" placeholder="如：sys_user" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="查询接口" prop="queryApi">
              <el-input v-model="form.queryApi" placeholder="自定义查询接口地址（可选）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="form.sort" :min="0" controls-position="right" class="full-width" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入报表描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="ReportConfig">
import { addConfig, delConfig, getConfig, listConfig, updateConfig } from '@/api/report/config'

const { proxy } = getCurrentInstance()
const configList = ref([])
const loading = ref(false)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const open = ref(false)
const title = ref('')
const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    reportCode: undefined,
    reportName: undefined,
    status: undefined
  },
  rules: {
    reportCode: [
      { required: true, message: '报表编码不能为空', trigger: 'blur' },
      { max: 64, message: '报表编码长度不能超过64个字符', trigger: 'blur' }
    ],
    reportName: [
      { required: true, message: '报表名称不能为空', trigger: 'blur' },
      { max: 128, message: '报表名称长度不能超过128个字符', trigger: 'blur' }
    ]
  }
})
const { queryParams, form, rules } = toRefs(data)

/** 查询报表配置列表 */
function getList() {
  loading.value = true
  listConfig(queryParams.value).then(response => {
    configList.value = response.rows
    total.value = response.total
  }).finally(() => {
    loading.value = false
  })
}

/** 表单重置 */
function reset() {
  form.value = {
    id: undefined,
    reportCode: undefined,
    reportName: undefined,
    description: undefined,
    dataSource: undefined,
    queryApi: undefined,
    status: 1,
    sort: 0
  }
  proxy.resetForm('configRef')
}

/** 取消按钮 */
function cancel() {
  open.value = false
  reset()
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm('queryRef')
  handleQuery()
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = '新增报表配置'
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const id = row?.id || ids.value[0]
  getConfig(id).then(response => {
    form.value = response.data
    open.value = true
    title.value = '修改报表配置'
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs.configRef.validate(valid => {
    if (!valid) return
    const request = form.value.id ? updateConfig(form.value) : addConfig(form.value)
    request.then(() => {
      proxy.$modal.msgSuccess(form.value.id ? '修改成功' : '新增成功')
      open.value = false
      getList()
    })
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const configIds = row?.id || ids.value
  proxy.$modal.confirm(`是否确认删除报表配置编号为"${configIds}"的数据项？`).then(() => {
    return delConfig(configIds)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess('删除成功')
  }).catch(() => {})
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('report/config/export', { ...queryParams.value }, `report_config_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style scoped lang="scss">
.full-width {
  width: 100%;
}
</style>
