<template>
    <div class="tab-container">
        <div style="display: flex;justify-content: space-between;">
            <el-form :inline="true">
                <el-form-item label="搜索：">
                    <el-input v-model="input" size="mini" clearable/>
                </el-form-item>
            </el-form>
            <div>
                <el-button size="mini" type="primary" @click="add">新增</el-button>
            </div>
        </div>
        <el-table :data="tableData" border fit highlight-current-row style="width:100%" size="mini" :max-height="height+'px'">
            <el-table-column prop="name" label="用户名" align="center">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.name}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" align="center">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.roles.name}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="remarks" label="备注" align="center">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.remarks}}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center">
                <template slot-scope="scope">
                    <el-button type="primary" size="mini" @click="handleEdit(scope)">修改</el-button>
                    <el-button type="danger" size="mini" @click="handleDelete(scope)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-row>
            <el-col :span="24">
                <div class="pagination">
                    <el-pagination
                            @size-change="handleSizeChange"
                            @current-change="handleCurrentChange"
                            :current-page="paginations.currentPage"
                            :page-sizes="paginations.pageSizes"
                            :page-size="paginations.pageSize"
                            :layout="paginations.layout"
                            :total="paginations.total">
                    </el-pagination>
                </div>
            </el-col>
        </el-row>
        <el-dialog :visible.sync="dialogVisible" :title="dialogType==='edit'?'修改用户':'新增用户'" width="30%">
            <el-form :model="form" label-width="100px" label-position="right" ref="form">
                <el-form-item label="用户名称:" prop="name" :rules="[{required:true,message:'不能为空',trigger: 'blur'}]">
                    <el-input v-model="form.name" placeholder="用户名称" />
                </el-form-item>
                <el-form-item label="密码:" prop="password" :rules="[{ required: true, message: '请输入密码', trigger: 'blur' }]" v-if="dialogType!=='edit'">
                    <el-input placeholder="请输入密码" v-model="form.password" show-password></el-input>
                </el-form-item>
                <el-form-item label="密码:" prop="password" v-if="dialogType==='edit'">
                    <el-input placeholder="请输入密码" v-model="form.password" show-password></el-input>
                </el-form-item>
                <el-form-item label="备注:">
                    <el-input v-model="form.remarks" placeholder="备注" />
                </el-form-item>
                <el-form-item label="选择角色:">
                    <el-checkbox-group v-model="form.roles">
                        <el-checkbox v-for="item in roles" :label="item.id" :key="item.id">{{item.name}}</el-checkbox>
                    </el-checkbox-group>
                </el-form-item>
            </el-form>
            <div style="text-align:right;">
                <el-button type="danger" @click="dialogVisible=false">取消</el-button>
                <el-button type="primary" @click="confirmRole('form')">提交</el-button>
            </div>
        </el-dialog>
    </div>
</template>
<script>
    import {getAdminTable,addAdmin,updateAdmin,deleteAdmin} from "@/api/admin";
    import {deepClone} from "@/utils";
    import {addRole, deleteRole, getRoles, updateRole} from "@/api/role";
    const defaultForm={
        name:'',
        password:'',
        roles:[],
        remarks:'',
        id:0
    };
    export default {
        name:'DataManagement',
        computed: {
            routesData() {
                return this.routes
            }
        },
        data(){
            return{
                form:Object.assign({},defaultForm),
                roles:[],

                dialogVisible: false,
                dialogType: 'new',
                routes: [],
                defaultProps: {
                    children: 'children',
                    label: 'title'
                },
                delDialog:{
                    title:'',
                    show:false,
                },
                addDialog:{
                    title:'',
                    show:false,
                },
                customerInfo:[],
                input:'',
                allTableData:[],
                fuzzySearch:[],
                height:0,
                paginations:{
                    currentPage:1,//当前页数
                    pageSizes:[25,50,100],//每页显示多少条
                    pageSize:25,//一页显示多少条
                    layout:'total,sizes,prev,pager,next,jumper',
                    total:0//总数
                },
                tableData:[],
                filterTableData:[],
                page:1,

            }
        },
        watch:{
            'input':function(v){
                this.searchFor(v);
            }
        },
        created(){
            this.height=document.body.clientHeight-84-60-120;
            this.getAdminTable();
            this.getRoles();
        },
        methods:{
            handleDelete({ $index, row }) {
                this.$confirm('确认删除用户','警告',{
                    confirmButtonText: '提交',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                    .then(async() => {
                        await deleteAdmin(row.id)
                        this.tableData.splice($index, 1)
                        this.$message({
                            type: 'success',
                            message: '删除成功'
                        })
                    })
            },
            handleEdit(scope) {
                if(this.$refs['form']!==undefined){
                    this.$refs['form'].resetFields();
                }
                this.dialogType = 'edit';
                this.dialogVisible = true;
                this.form.name=scope.row.name;
                this.form.roles=scope.row.roles.id;
                this.form.id=scope.row.id;
            },
            async getRoles() {
                const res = await getRoles()
                this.roles = res.data
            },
            getAdminTable(){
                getAdminTable()
                .then(response=>{
                    this.allTableData=response.data;
                    this.filterTableData=response.data;
                    this.fuzzySearch=response.data;
                    //设置分页数据
                    this.setPaginations();
                })
            },
            async confirmRole(form) {
                const isEdit = this.dialogType === 'edit';
                this.$refs[form].validate(valid=>{
                    if(valid){
                        if (isEdit) {
                            updateAdmin(this.form.id,this.form)
                                .then(()=>{
                                    this.getAdminTable();
                                    this.getRoles();
                                })
                        }else {
                            addAdmin(this.form)
                            .then(()=>{
                                this.getAdminTable();
                                this.getRoles();
                            })
                        }
                        this.$message({
                            message: '添加成功',
                            type: 'success'
                        })
                        this.dialogVisible = false
                    }
                });


            },
            add(){
                this.form=Object.assign({},defaultForm);
                this.dialogType = 'new'
                this.dialogVisible = true
                if(this.$refs['form']!==undefined){
                    this.$refs['form'].resetFields();
                }
            },
            del(){
                this.delDialog={
                    show:true,
                    title:'删除客服',
                    width:"20%"
                };
            },
            handleCurrentChange(page){
                // 当前页
                this.page=page;
                const sortnum=this.paginations.pageSize*(page-1);
                const table=this.allTableData.filter((item,index)=>{
                    return index>=sortnum;
                });
                // 设置默认分页数据
                this.tableData = table.filter((item,index)=>{
                    return index<this.paginations.pageSize;
                });
            },
            setPaginations(){
                //分页属性设置
                this.paginations.total=this.allTableData.length;
                this.paginations.currentPage=this.page;
                this.paginations.pageSize=25;
                if(this.paginations.currentPage>1){
                    this.handleCurrentChange(this.paginations.currentPage);
                }else if(this.paginations.currentPage===1){
                    //设置默认的分页数据
                    this.tableData=this.allTableData.filter((item,index)=>{
                        return index<this.paginations.pageSize;
                    })
                }
            },
            handleSizeChange(val){
                //切换size
                this.paginations.currentPage=1;
                this.paginations.pageSize=val;
                this.tableData=this.allTableData.filter((item,index)=>{
                    return index<val;
                });
            },
            searchFor(v,is=''){
                if(v){
                    // filter()方法创建一个新的数组，新数组中的元素是通过检查指定数组中符合条件的所有元素。
                    // 注意：filter()不会对空数组进行检测。
                    // 注意：filter()不会改变原始数组。
                    this.allTableData=this.fuzzySearch.filter(data=>{
                        // some() 方法用于检测数组中的元素是否满足指定条件;
                        // some() 方法会依次执行数组的每个元素：
                        // 如果有一个元素满足条件，则表达式返回true , 剩余的元素不会再执行检测;
                        // 如果没有满足条件的元素，则返回false。
                        // 注意： some() 不会对空数组进行检测。
                        // 注意： some() 不会改变原始数组。
                        return Object.keys(data).some(key=>{
                            // indexOf() 返回某个指定的字符在某个字符串中首次出现的位置，如果没有找到就返回-1；
                            // 该方法对大小写敏感！所以之前需要toLowerCase()方法将所有查询到内容变为小写。
                            return String(data[key]).toLowerCase().indexOf(v)>-1
                        });

                    });
                    this.setPaginations();
                }
                if(this.input===''&&is===''){
                    this.allTableData=this.fuzzySearch;
                    this.setPaginations();
                }
            }
        }
    }
</script>
<style scoped>
    .el-dropdown-link {
        cursor: pointer;
        color: #409EFF;
    }
    .el-icon-arrow-down {
        font-size: 12px;
    }
    .tab-container{
        margin:30px;
    }
    .pagination{
        text-align:right;
        margin-top:10px;
    }
</style>
