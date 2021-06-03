<template>
    <div class="tab-container"
         v-loading="loading"
         element-loading-text="生成新租户,请勿关闭及刷新"
         element-loading-spinner="el-icon-loading"
         element-loading-background="rgba(0,0,0,0.8)">
        <div style="display: flex;justify-content: space-between;">
            <el-form :inline="true">
                <el-form-item label="搜索：">
                    <el-input v-model="input" size="mini" clearable/>
                </el-form-item>
            </el-form>
            <div>
                <el-button size="mini" type="primary" @click="addTenancy">新增</el-button>
                <el-button size="mini" type="danger" @click="deleteAllTenant">批量删除</el-button>
            </div>
        </div>
        <el-table :data="tableData" border fit highlight-current-row style="width:100%" size="mini" :max-height="height+'px'" @selection-change="handleSelectionChange">
            <el-table-column
                type="selection"
                align="center">
            </el-table-column>
            <el-table-column prop="numbering" label="租户编号" align="center"  min-width="10%">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.numbering}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="name" label="租户名称" align="center" min-width="15%">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.name}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="vue" label="绑定域名" align="center" min-width="15%">
                <template slot-scope="scope">
                    <el-popover trigger="hover" placement="top">
                        <p>客服地址:<el-link :underline="false" type="primary" :href="scope.row.ishttp===1?'https://'+scope.row.vue+'/#/':'http://'+scope.row.vue+'/#/'" target="_blank">{{scope.row.ishttp===1?'https://'+scope.row.vue+'/#/':'http://'+scope.row.vue+'/#/'}}</el-link></p>
                        <p>访客地址:<el-link :underline="false" type="primary" :href="scope.row.ishttp===1?'https://'+scope.row.vue+'/#/chat':'http://'+scope.row.vue+'/#/chat'" target="_blank">{{scope.row.ishttp===1?'https://'+scope.row.vue+'/#/chat':'http://'+scope.row.vue+'/#/chat'}}</el-link></p>
                        <div style="display: flex;justify-content: space-between">
                            <p>管理员账号:{{scope.row.numbering+'admin'}}</p>
                            <!--+' 访客地址:'+scope.row.ishttp===1?'https://'+scope.row.vue+'/#/':'http://'+scope.row.vue+'/#/'+' 管理员账号:'+scope.row.numbering+'admin'-->
                            <el-link :underline="false"
                                     v-clipboard:copy='scope.row.ishttp===1?"客服地址:https://"+scope.row.vue+"/#/ 访客地址:https://"+scope.row.vue+"/#/chat 管理员账号:"+scope.row.numbering+"admin":"客服地址:http://"+scope.row.vue+"/#/ 访客地址:http://"+scope.row.vue+"/#/chat 管理员账号:"+scope.row.numbering+"admin"'
                                     v-clipboard:success="onCopy"
                                     v-clipboard:error="onError">复制</el-link>
                        </div>
                        <div slot="reference" class="name-wrapper">
                            <el-tag size="medium">{{ scope.row.vue}}</el-tag>
                        </div>
                    </el-popover>
                </template>
            </el-table-column>
            <el-table-column prop="ishttp" label="SSL证书" align="center" min-width="10%">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.ishttp|ssl}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="created_at" label="新增时间" align="center" min-width="15%">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.created_at}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="expiry_date" label="到期时间" align="center" min-width="15%">
                <template slot-scope="scope">
                    <span style="margin-left: 10px">{{scope.row.expiry_date}}</span>
                </template>
            </el-table-column>
            <el-table-column label="操作" align="center" min-width="20%">
                <template slot-scope="scope">
                    <el-button type="success" size="mini" @click="getTenancyInfo(scope.row)">查看</el-button>
                    <el-button type="primary" size="mini" @click="updateTenant(scope.row)">修改</el-button>
                    <el-popconfirm
                        style="margin-left: 10px"
                        confirmButtonText='确定'
                        cancelButtonText='取消'
                        icon="el-icon-info"
                        @onConfirm="deleteTenant(scope)"
                        iconColor="red"
                        title="该租户所有信息及租户数据库全部删除,不可逆操作">
                        <el-button slot="reference" type="danger" size="mini">删除</el-button>
                    </el-popconfirm>
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
        <addTenantDialog :form="form" :dialog="addDialog" @loading="wait" @done="done"></addTenantDialog>
        <updateDialog :form="updateInfo" :updatedialog="updateDialog" @done="done"></updateDialog>
        <viewDialog :form="viewInfo" :viewdialog="viewDialog" @done="done"></viewDialog>
    </div>
</template>
<script>
import {getTenancyTable,deleteTenant,deleteAllTenant,deleteAdmin} from "@/api/admin";
import addTenantDialog from "@/views/tenant/components/AddTenantDialog";
import updateDialog from "@/views/tenant/components/UpdateDialog";
import viewDialog from "@/views/tenant/components/ViewDialog";
const defaultForm={
    admin:'',
    certificate:{},
    expiry_date:'',
    ishttp:1,
    fqdn:'',
    location:".live003.com",
    name:'',
    numbering:'',
    password:'',
    seat:1,
    type:'secondary',
    user:[]
};
export default {
    name:'TenantIndex',
    components:{addTenantDialog,updateDialog,viewDialog},
    filters:{
        ssl(v){
            if(v===1){
                return "是";
            }else{
                return "否";
            }
        }
    },
    data(){
        return{
            form:Object.assign({},defaultForm),
            viewInfo:{},
            updateInfo:{},
            addDialog:{
                title:'',
                show:false
            },
            updateDialog:{
                title:'',
                show:false
            },
            viewDialog:{
                title:'',
                show:false
            },
            loading:false,
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
            multipleSelection: []
        }
    },
    watch:{
        'input':function(v){
            this.searchFor(v);
        }
    },
    created(){
        this.height=document.body.clientHeight-84-60-120;
        this.getTenancyTable();
    },
    methods:{
        getTenancyInfo(info){
            this.viewInfo=Object.assign({},info);
            this.viewInfo.textarea='';
            this.viewDialog={
                title:'查看租户'+info.name+'详情',
                show:true
            }
        },
        updateTenant(info){
            this.updateInfo=Object.assign({},info);
            this.updateInfo.location='.live003.com';
            this.updateDialog={
                show:true,
                title:'修改租户信息'
            }
        },
        handleSelectionChange(val) {
            this.multipleSelection = val;
        },
        deleteAllTenant(){
            if(this.multipleSelection.length===0){
                return this.$message.error('请选择删除的租户');
            }
            this.$confirm('此操作将不可逆,请问继续删除？', '警告', {
                confirmButtonText: '提交',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                deleteAllTenant(this.multipleSelection)
                    .then(()=>{
                        this.$message.success('删除成功');
                        this.getTenancyTable();
                    });
            });
        },
        deleteTenant({index,row}){
            this.tableData.splice(index,1);
            deleteTenant(row.fqdn)
                .then(()=>{
                    this.$message.success('删除成功');
                    this.getTenancyTable();
                });
        },
        done(){
            this.loading=false;
            this.getTenancyTable();
        },
        wait(){
            this.loading=true;
        },
        addTenancy(){
            this.form=Object.assign({},defaultForm);
            this.addDialog={
                title:"新增租户",
                show:true
            }
        },
        getTenancyTable(){
            getTenancyTable()
                .then(response=>{
                    this.allTableData=response.data;
                    this.filterTableData=response.data;
                    this.fuzzySearch=response.data;
                    //设置分页数据
                    this.setPaginations();
                })
        },
        onCopy (e) {
            this.$message.success('复制成功');
        },
        onError (e) {
            this.$message.error('复制失败');
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
