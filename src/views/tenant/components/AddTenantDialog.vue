<template>
    <el-dialog
        :title="dialog.title"
        :visible.sync="dialog.show"
        width="30%"
        :before-close="handleClose">
        <el-steps :active="active" finish-status="success" :align-center="true" style="margin-bottom:10px;">
            <el-step title="基本信息"></el-step>
            <el-step title="添加客服"></el-step>
            <el-step title="绑定域名"></el-step>
        </el-steps>
        <el-form :model="form" ref="form" label-width="100px" :rules="rules" class="content" style="height: 350px">
            <div v-if="active===0">
                <el-form-item label="租户编号:" prop="numbering" :rules="{required:true,message:'不能为空',trigger:'blur'}">
                    <el-input v-model="form.numbering" placeholder="租户编号"></el-input>
                </el-form-item>
                <el-form-item label="租户名称:" prop="name" :rules="{required:true,message:'租户备注',trigger:'blur'}">
                    <el-input v-model="form.name" placeholder="租户名称"></el-input>
                </el-form-item>
                <el-form-item label="坐席数量:">
                    <el-input-number v-model="form.seat" :min="0" :max="999"></el-input-number>
                </el-form-item>
                <el-form-item label="到期日期:" prop="expiry_date" :rules="{required:true,message:'到期时间不能为空',trigger:'blur'}">
                    <el-date-picker
                        v-model="form.expiry_date"
                        type="date"
                        :clearable="false"
                        placeholder="选择日期">
                    </el-date-picker>
                </el-form-item>
            </div>
            <div v-if="active===1">
                <div style="display: flex;flex-direction: column;align-items: center">
                    <div>管理员登录账号：{{form.numbering+'admin'}}</div>
                        <el-form-item
                            v-for="(u, index) in form.user"
                            :label="'客服'+(index+1)"
                            :key="u.key"
                            :prop="'user.'+index+'.value'"
                            :rules="{required:true,message:'客服账号不能为空',trigger:'blur'}">
                            <div style="display: flex;align-items: center">
                                <el-input v-model="u.value"></el-input>
                                <i class="el-icon-delete" style="font-size: 16px;cursor: pointer;" @click.prevent="removeUser(u)"></i>
                            </div>
                        </el-form-item>
                    <el-button size="mini" @click="addUser">新增客服<i class="el-icon-circle-plus-outline"></i></el-button>
                </div>
            </div>
            <div v-if="active===2">
                <el-form-item label="域名类型:">
                    <el-select v-model="form.type">
                        <el-option
                            v-for="item in options"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                </el-form-item>
                <div v-if="form.type==='secondary'">
                    <el-form-item label="域名:" prop="fqdn">
                        <el-input placeholder="请输入域名" v-model="form.fqdn">
                            <template slot="append">{{form.location}}</template>
                        </el-input>
                    </el-form-item>
                </div>
                <div v-if="form.type==='tenant'">
                    <el-form-item label="域名:" prop="fqdn">
                        <el-input placeholder="请输入域名" v-model="form.fqdn"></el-input>
                    </el-form-item>
                    <el-form-item label="安全类型:">
                        <el-select v-model="form.ishttp">
                            <el-option
                                v-for="item in security"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <div v-if="form.ishttp">
                        <el-form-item label="SSL证书:">
                            <el-upload
                                class="upload-demo"
                                drag
                                :action="config.link"
                                :limit="1"
                                :before-upload="beforeSsl">
                                <i class="el-icon-upload"></i>
                                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                                <div class="el-upload__tip" slot="tip">只能上传pfx文件，且不超过50kb</div>
                            </el-upload>
                        </el-form-item>
                        <el-form-item label="证书密码:" prop="password" :rules="{required:true,message:'密码不能为空',trigger:'blur'}">
                            <el-input v-model="form.password" placeholder="证书密码"></el-input>
                        </el-form-item>
                    </div>
                </div>
            </div>
        </el-form>
        <div style="text-align: right;">
            <el-button type="primary" @click="--active" v-if="active!==0">上一步</el-button>
            <el-button type="primary" @click="next('form')" v-if="active!==2">下一步</el-button>
            <el-button type="primary" @click="submitForm('form')" v-if="active===2">提交</el-button>
        </div>
    </el-dialog>
</template>

<script>
import {addTenant} from "@/api/admin";

export default {
    name:'AddDialog',
    props:{
        dialog:{
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
        const fqdn=(rule,value,callback)=>{
            if(value===''){
                callback(new Error('域名不能为空'));
            }
            if(this.form.type==='secondary'){
                let reg = new RegExp("[/\\\\.*:?\"<>| ]")
                if(reg.test(value)){
                    callback(new Error('不能输入特殊符号及点(·)，如证书不支持二级通配符,则会失效'));
                }
            }else{
                let reg=/\w+\.\w+\.\w+/;
                if(!reg.test(value)){
                    callback(new Error('请输入正确的域名。例：www.baidu.com'));
                }
            }
            callback();
        }
        return {
            active: 0,
            security:[{
                value:0,
                label:'Http'
            },{
                value:1,
                label:'Https'
            }],
            options: [{
                value:'secondary',
                label:'二级域名'
            }, {
                value:'tenant',
                label:'租户域名'
            }],
            rules:{
                fqdn: [{ required: true, trigger: 'blur', validator:fqdn}],
            }
        };
    },
    watch:{
        form:function(){
            if(this.$refs['form']!==undefined){
                this.$refs['form'].resetFields();
            }
            this.form.user=[];
            this.active=0;
            this.form.expiry_date=this.getTime();
        },
        'form.seat':function (v){
            if(v===undefined){
                this.form.seat=1;
            }
        }
    },
    methods: {
        beforeSsl(file){
            var type=file.type.split('/')[0];//application
            var size=file.size/1024/1024<0.05;//application
            if(type!=='application'){
                this.$message.error('上传的文件格式不正确!');
                return false;
            }
            if(!size){
                this.$message.error('上传大小不能超过50KB!');
                return false;
            }
            this.form.certificate=file;
        },
        p(s){
            return s<10?'0'+s:s;
        },
        submitForm(form) {
            this.$refs[form].validate((valid) => {
                if (valid) {
                    const date=new Date(this.form.expiry_date);
                    const resDate = date.getFullYear() + '-' + this.p((date.getMonth() + 1)) + '-' + this.p(date.getDate());
                    this.form.admin=this.form.numbering+'admin';
                    this.form.expiry_date=resDate+' 23:59:59';
                    if(this.form.type==="secondary"){
                        this.form.fqdn=this.form.fqdn.trim()+this.form.location;
                    }
                    var form_data=new FormData();
                    if(JSON.stringify(this.form.certificate) !== "{}"){
                        form_data.append("ssl",this.form.certificate);
                    }else{
                        if(this.form.password){
                            form_data.append("ssl",'');
                            return this.$message.error('证书不能为空!');
                        }
                    }
                    form_data.append("admin",this.form.admin);
                    form_data.append("expiry_date",this.form.expiry_date);
                    form_data.append("fqdn",this.form.fqdn);
                    form_data.append("ishttp",this.form.ishttp);
                    form_data.append("name",this.form.name);
                    form_data.append("numbering",this.form.numbering);
                    form_data.append("password",this.form.password);
                    form_data.append("seat",this.form.seat);
                    form_data.append("type",this.form.type);
                    form_data.append("user",JSON.stringify(this.form.user));
                    this.dialog.show=false;
                    this.$emit('loading');
                    addTenant(form_data)
                    .then(res=>{
                        this.$emit('done');
                        if(res.code===200){
                            this.$message.success('添加成功');
                        }
                    });
                }
            });
        },
        removeUser(item) {
            var index = this.form.user.indexOf(item);
            if (index !== -1) {
                this.form.user.splice(index, 1);
            }
            this.form.seat=this.form.seat+1;
        },
        addUser() {
            if(!this.form.seat--){
                this.form.seat=0;
                return this.$message.error('坐席位置不够,请返回上一步修改');
            }
            this.form.user.push({
                value: '',
                key: Date.now()
            });
        },
        next(form) {
            this.$refs[form].validate((valid) => {
                if (valid) {
                    ++this.active;
                }
            });
        },
        getTime(){
            var myDate=new Date();
            var year=myDate.getFullYear()+1;
            var month=myDate.getMonth()+1;
            if(month<10){
                month='0'+month;
            }
            var day= myDate.getDate();
            if(day<10){
                day='0'+day;
            }
            var hour= myDate.getHours();
            if(hour<10){
                hour='0'+hour;
            }
            var minutes= myDate.getMinutes();
            if(minutes<10){
                minutes='0'+minutes;
            }
            var seconds= myDate.getSeconds();
            if(seconds<10){
                seconds='0'+seconds;
            }
            return year+'-'+month+'-'+day;
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
.content{
    width: 100%;
    overflow-y: scroll;
}
</style>