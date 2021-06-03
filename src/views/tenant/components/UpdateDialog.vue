<template>
    <el-dialog
        :title="updatedialog.title"
        :visible.sync="updatedialog.show"
        width="30%"
        top="2vh"
        :before-close="handleClose">
        <el-form :model="form" ref="form" :rules="rules" label-width="100px">
            <el-form-item label="租户编号:">
                <el-input v-model="form.numbering" :disabled="true" placeholder="租户编号"></el-input>
            </el-form-item>
            <el-form-item label="租户名称:" prop="name" :rules="{required:true,message:'租户备注',trigger:'blur'}">
                <el-input v-model="form.name" placeholder="租户名称"></el-input>
            </el-form-item>
            <el-form-item label="剩余坐席:">
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
        </el-form>
        <div style="text-align: right;">
            <el-button type="primary" @click="updatedialog.show=false">返回</el-button>
            <el-button type="primary" @click="submitForm('form')">保存</el-button>
        </div>
    </el-dialog>
</template>

<script>
import {updateTenant} from "@/api/admin";
export default {
    name:'UpdateDialog',
    props:{
        updatedialog:{
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
            tag:'',
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
            this.tag=this.form.type;
            if(this.form.type==='secondary'){
                this.form.fqdn=this.form.vue.split('.')[0];
            }else{
                this.form.fqdn=this.form.vue;
            }
        },
        'form.seat':function (v){
            if(v===undefined){
                this.form.seat=1;
            }
        },
        'form.type':function(v){
            if(this.tag!==v){
                this.form.fqdn='';
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
        submitForm(form) {
            this.$refs[form].validate((valid) => {
                if (valid) {
                    var d=new Date(this.form.expiry_date);
                    this.form.expiry_date=d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate() + ' 23:59:59';
                    if(this.form.type==="secondary"){
                        this.form.fqdn=this.form.fqdn.trim()+this.form.location;
                    }
                    var form_data=new FormData();
                    if(JSON.stringify(this.form.certificate) !== "{}"){
                        form_data.append("ssl",this.form.certificate);
                    }else{
                        form_data.append("ssl",'');
                    }
                    form_data.append("expiry_date",this.form.expiry_date);
                    form_data.append("fqdn",this.form.fqdn);
                    form_data.append("ishttp",this.form.ishttp);
                    form_data.append("name",this.form.name);
                    form_data.append("numbering",this.form.numbering);
                    form_data.append("password",this.form.password);
                    form_data.append("seat",this.form.seat);
                    form_data.append("type",this.form.type);
                    form_data.append("id",this.form.id);
                    this.updatedialog.show=false;
                    updateTenant(form_data)
                        .then(res=>{
                            this.$emit('done');
                            if(res.code===200){
                                this.$message.success('修改成功');
                            }
                        })
                }
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