<template>
    <el-dialog
        :title="viewdialog.title"
        :visible.sync="viewdialog.show"
        width="40%"
        :before-close="handleClose">
        <div style="display: flex;justify-content:flex-end">
            <el-button size="mini" type="danger" style="margin-bottom: 10px" @click="blackdialog">黑名单信息</el-button>
            <el-button size="mini" style="margin-bottom: 10px" @click="popdialog">添加白名单</el-button>
        </div>
        <el-table
            :data="tableData"
            fit
            highlight-current-row
            border
            size="mini"
            v-loading="loadings"
            class="content"
            style="width: 100%;max-height:300px;">
            <el-table-column prop="name" label="登录账号" min-width="50%" align="center">
                <template slot-scope="scope">
                    <span>{{scope.row.name}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" min-width="50%" align="center">
                <template slot-scope="scope">
                    <span>{{scope.row.role}}</span>
                </template>
            </el-table-column>
            <el-table-column prop="address" label="操作" align="center">
                <template slot-scope="scope">
                    <el-button
                        size="mini"
                        @click="handleEdit(scope.$index, scope.row)">修改</el-button>
                    <el-button
                        size="mini"
                        type="danger"
                        @click="handleDelete(scope.$index, scope.row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog
            width="30%"
            title="新增用户"
            :visible.sync="innerVisible"
            append-to-body>
            <el-form :model="addInfo" ref="addInfo">
                <div style="display: flex;flex-direction: column;align-items: center">
                    <el-form-item
                        v-for="(u,index) in addInfo.user"
                        :label="'客服'+(index+1)"
                        :key="u.key"
                        :prop="'user.'+index+'.value'"
                        :rules="{required:true,message:'客服账号不能为空',trigger:'blur'}">
                        <div style="display: flex;align-items: center">
                            <el-input v-model="u.value">{{u.value}}</el-input>
                            <i class="el-icon-delete" style="font-size: 16px;cursor: pointer;" @click.prevent="removeUser(u)"></i>
                        </div>
                    </el-form-item>
                    <el-form-item>
                        <el-button size="mini" @click="addUser">新增客服<i class="el-icon-circle-plus-outline"></i></el-button>
                    </el-form-item>
                </div>
            </el-form>
            <div style="text-align: right">
                <el-button size="mini" type="primary" @click="submit('addInfo')">提交</el-button>
            </div>
        </el-dialog>
        <el-dialog
            width="30%"
            title="修改用户"
            :visible.sync="updateUser"
            append-to-body>
            <el-form :model="form" ref="submitForm" label-width="100px" >
                <el-form-item label="登录账号:" prop="name" :rules="{required:true,message:'登录账号不能为空',trigger:'blur'}">
                    <el-input v-model="form.name" placeholder="请输入内容" v-if="form.role==='管理员'" :disabled="true"></el-input>
                    <el-input v-model="form.name" placeholder="请输入内容" v-if="form.role==='客服'"></el-input>
                </el-form-item>
                <el-form-item label="密码:">
                    <el-input v-model="form.password" placeholder="请输入修改密码"></el-input>
                </el-form-item>
            </el-form>
            <div style="text-align: right">
                <el-button size="mini" type="primary" @click="updateUser=false">返回</el-button>
                <el-button size="mini" type="primary" @click="submitUpdate">提交</el-button>
            </div>
        </el-dialog>
        <el-dialog
            width="30%"
            :visible.sync="whitelist"
            append-to-body>
            <el-input :rows="10" type="textarea" v-model="textarea" :placeholder="defaultContent"></el-input>
            <div style="text-align: right;margin-top: 10px">
                <el-button size="mini" @click="whitelist=false">取消</el-button>
                <el-button size="mini" type="primary" @click="addWhitelist">添加</el-button>
            </div>
        </el-dialog>
        <el-dialog
            width="30%"
            :visible.sync="black"
            append-to-body>
            <el-table
                :data="blacklist"
                fit
                highlight-current-row
                border
                size="mini"
                class="content"
                style="width: 100%;max-height:300px;">
                <el-table-column prop="name" label="IP" align="center">
                    <template slot-scope="scope">
                        <span>{{scope.row.ip}}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="role" label="地址" align="center">
                    <template slot-scope="scope">
                        <span>{{scope.row.address}}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="address" label="操作" align="center">
                    <template slot-scope="scope">
                        <el-button
                            size="mini"
                            type="danger"
                            @click="deleteBlack(scope.$index, scope.row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
        <div style="text-align: right;margin-top: 10px">
            <el-button size="mini" @click="viewdialog.show=false">取消</el-button>
            <el-button size="mini" type="primary" @click="addUserInfo">新增</el-button>
        </div>
    </el-dialog>
</template>
<script>
import {delUser, getTenancyInfo, storeUser, editUser, addTenant, addTenancyWhitelist, deleteBlack} from "@/api/admin";
export default {
    name:'ViewDialog',
    props:{
        viewdialog:{
            type:Object,
            default(){
                return {};
            }
        },
        form:{
            type:Object,
            default() {
                return {};
            }
        }
    },
    data() {
        return {
            defaultContent: '1、添加白名单后,使用此IP的当前租户可以无限登录错误\n2、IP可以存储多个,具体如下：\n192.168.1.1\n192.168.1.2\n192.168.1.3',
            addInfo:{
                user:[]
            },
            black:false,
            dynamicValidateForm: {
                domains: [{
                    value: ''
                }]
            },
            textarea:'',
            submitForm:{
                id:'',
                name:'',
                password:''
            },
            whitelist:false,
            updateUser:false,
            seat:0,
            innerVisible:false,
            loadings:false,
            tableData:[],
            blacklist:[],
        };
    },
    watch:{
        'viewdialog.show':function(v){
            if(v){
                this.loadings=true;
                this.getTenancyInfo();
            }
        }
    },
    methods: {
        deleteBlack(index,row){
            this.$confirm('租户在清除黑名单无法登录，需要清除当前浏览器缓存','警告',{
                confirmButtonText:'提交',
                cancelButtonText:'取消',
                type: 'warning'
            }).then(()=>{
                this.form.id=row.id;
                this.blacklist.splice(index,1);
                deleteBlack(this.form)
                .then(()=>{
                    this.$message.success('删除成功');
                })
            });
        },
        blackdialog(){
            this.black=true;
        },
        popdialog(){
            this.whitelist=true;
            this.textarea=this.form.textarea;
        },
        addWhitelist(){
            this.whitelist=false;
            this.form.textarea=this.textarea.trim();
            addTenancyWhitelist(this.form)
            .then(()=>{
                this.getTenancyInfo();
                this.$message.success('操作白名单成功');
            });
        },
        getTenancyInfo(){
            getTenancyInfo(this.form.fqdn)
                .then(res=>{
                    this.seat=res.seat;
                    this.loadings=false;
                    this.tableData=res.data;
                    this.blacklist=res.blacklist;
                    this.form.textarea=res.whitelist;
                });
        },
        submitUpdate(){
            this.updateUser=false;
            editUser(this.form)
            .then(()=>{
                this.$message.success('修改成功');
                this.getTenancyInfo();
                this.$emit('done');
            });
        },
        submit(form){
            this.$refs[form].validate((valid) => {
                if (valid) {
                    this.form.user=this.addInfo.user;
                    this.innerVisible=false;
                    storeUser(this.form)
                        .then(()=>{
                            this.$message.success('新增成功');
                            this.getTenancyInfo();
                            this.$emit('done');
                        });
                }
            });
        },
        removeUser(item) {
            ++this.form.seat;
            var index = this.addInfo.user.indexOf(item)
            if (index !== -1) {
                this.addInfo.user.splice(index, 1)
            }
        },
        addUserInfo(){
            this.innerVisible=true;
            this.form.seat=this.seat;
            this.addInfo.user=[];
        },
        addUser(){
            if(!this.form.seat--){
                this.form.seat=0;
                return this.$message.error('坐席位置不够');
            }
            this.addInfo.user.push({
                value: '',
                key: Date.now()
            });
        },
        handleEdit(index, row) {
            if(this.$refs['submitForm']!==undefined){
                this.$refs['submitForm'].resetFields();
            }
            this.form.role=row.role;
            this.updateUser=true;
            this.form.name=row.name;
            this.form.id=row.id;
            this.form.password='';
        },

        handleDelete(index,row){
            this.$confirm('如您删除客服,则坐席+1','警告',{
                confirmButtonText:'提交',
                cancelButtonText:'取消',
                type: 'warning'
            }).then(() => {
                this.form.id=row.id;
                delUser(this.form)
                    .then(()=>{
                        this.$message.success('删除成功');
                        this.getTenancyInfo();
                        this.$emit('done');
                    });
            });
        },
        handleClose(done) {
            this.$confirm('确认关闭？')
                .then(_ => {
                    done();
                })
                .catch(_ => {});
        }
    }
};
</script>
<style scoped>
>>>.el-dialog__body {
    padding: 10px 20px;
}
>>>.el-table {
    position: inherit;
    overflow: hidden;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    -webkit-box-flex: 1;
    -ms-flex: 1;
    flex: 1;
    width: 100%;
    max-width: 100%;
    background-color: #FFFFFF;
    font-size: 14px;
    color: #606266;
}
.content{
    width: 100%;
    /*border: 1px green solid;*/
    overflow-y: scroll;
}
</style>