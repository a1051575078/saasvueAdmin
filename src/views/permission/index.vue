<template>
    <div class="app-container">
        <el-button type="primary" @click="handleAddRole">添加权限</el-button>
        <el-table
                :data="tableData"
                style="width: 100%;margin-top:30px;"
                row-key="id"
                border
                default-expand-all
                :tree-props="{children: 'children', hasChildren: 'hasChildren'}">
            <el-table-column
                    prop="meta.title"
                    label="路由菜单"
                    align="center"
                    min-width="10%">
            </el-table-column>
            <el-table-column
                    prop="path"
                    label="菜单路径"
                    align="center"
                    min-width="70%">
            </el-table-column>
            <el-table-column align="center" label="编辑" min-width="20%">
                <template slot-scope="scope" v-if="scope.row.id!==0">
                    <el-button type="primary" size="mini" @click="handleEdit(scope)">修改權限</el-button>
                    <el-button type="danger" size="mini" @click="handleDelete(scope)">刪除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-dialog :visible.sync="dialogVisible" :title="dialogType==='edit'?'修改权限路由':'新增权限路由'" width="30%">
            <el-form :model="form" label-width="100px" label-position="left" ref="form" :rules="rules">
                <el-form-item label="选择层级:">
                    <el-select v-model="form.father_id" placeholder="请选择">
                        <el-option
                                v-for="item in tableData"
                                :key="item.id"
                                :label="item.meta.title"
                                :value="item.id">
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="菜单名称:" prop="title">
                    <el-input v-model="form.title" placeholder="菜单名称" />
                </el-form-item>
                <el-form-item label="访问路径:" prop="path">
                    <el-input v-model="form.path" placeholder="/xxx/xxx/如果前端没有创建这个文件,无法登录" />
                </el-form-item>
                <el-form-item label="选择角色:" v-if="roles&&dialogType!=='edit'">
                    <el-checkbox-group v-model="form.roles" @change="handleCheckAllChange" >
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
    import path from 'path'
    import { deepClone } from '@/utils'
    import { addPermission, getRoles, updatePermission, deleteRole, updateRole } from '@/api/role'
    import store from "@/store";

    const defaultRole = {
        key: '',
        name: '',
        description: '',
        routes: []
    }
    const defaultForm={
        father_id:0,
        roles: [],
        path:'',
        title:'',
        id:0
    }

    export default {
        data() {
            var title=(rule,value,callback)=>{
                if(value===''){
                    callback(new Error('不能为空'));
                }
                callback();
            };
            var path=(rule,value,callback)=>{
                if(value===''){
                    callback(new Error('不能为空'));
                }
                callback();
            };
            return {
                role: Object.assign({}, defaultRole),
                routes: [],
                rolesList: [],
                roles:[],
                dialogVisible: false,
                dialogType: 'new',
                checkStrictly: false,
                defaultProps: {
                    children: 'children',
                    label: 'title'
                },
                form:Object.assign({},defaultForm),
                tableData: [],
                value: '',
                rules:{
                    title:[
                        {required:true,validator:title,trigger:'blur'}
                    ],
                    path:[
                        {required:true,validator:path,trigger:'blur'}
                    ],
                }
            }
        },
        computed: {
            routesData() {
                return this.routes
            }
        },
        created() {
            // Mock: get all routes and roles list from server
            this.getRoutes();
            this.getRoles();
        },
        methods:{
            handleCheckAllChange(val) {
                console.log(val)
            },
            async getRoutes() {
                await this.$store.dispatch('user/getInfo')
                .then(res=>{
                    this.tableData=res.menus;
                    this.tableData.unshift({id:0,meta:{title:'顶级菜单'}});
                })
            },
            async getRoles() {
                const res = await getRoles()
                this.roles = res.data
            },
            //Reshape the routes structure so that it looks the same as the sidebar
            generateRoutes(routes, basePath = '/') {
                const res = []

                for (let route of routes) {
                    // skip some route
                    if (route.hidden) { continue }

                    const onlyOneShowingChild = this.onlyOneShowingChild(route.children, route)

                    if (route.children && onlyOneShowingChild && !route.alwaysShow) {
                        route = onlyOneShowingChild
                    }

                    const data = {
                        path: path.resolve(basePath, route.path),
                        title: route.meta && route.meta.title

                    }

                    // recursive child routes
                    if (route.children) {
                        data.children = this.generateRoutes(route.children, data.path)
                    }
                    res.push(data)
                }
                return res
            },
            generateArr(routes) {
                let data = []
                routes.forEach(route => {
                    data.push(route)
                    if (route.children) {
                        const temp = this.generateArr(route.children)
                        if (temp.length > 0) {
                            data = [...data, ...temp]
                        }
                    }
                })
                return data
            },
            handleAddRole() {
                this.form = Object.assign({}, defaultForm)
                if(this.$refs['form']!==undefined){
                    this.$refs['form'].resetFields();
                }
                if (this.$refs.tree) {
                    this.$refs.tree.setCheckedNodes([])
                }
                this.dialogType = 'new'
                this.dialogVisible = true
            },
            handleEdit(scope) {
                if(this.$refs['form']!==undefined){
                    this.$refs['form'].resetFields();
                }
                this.dialogType = 'edit'
                this.dialogVisible = true
                this.checkStrictly = true
                this.form.father_id=Number(scope.row.father_id);
                this.form.id=scope.row.id;
                this.form.path=scope.row.path;
                this.form.title=scope.row.meta.title;
            },
            handleDelete({ $index, row }) {
                this.$confirm('确认删除权限', '警告', {
                    confirmButtonText: '提交',
                    cancelButtonText: '取消',
                    type: 'warning'
                })
                    .then(async() => {
                        await deleteRole(row.id)
                        this.getRoutes();
                        this.getRoles();
                        this.$message({
                            type: 'success',
                            message: '删除成功'
                        })
                    })
            },
            generateTree(routes, basePath = '/', checkedKeys) {
                const res = []

                for (const route of routes) {
                    const routePath = path.resolve(basePath, route.path)

                    // recursive child routes
                    if (route.children) {
                        route.children = this.generateTree(route.children, routePath, checkedKeys)
                    }

                    if (checkedKeys.includes(routePath) || (route.children && route.children.length >= 1)) {
                        res.push(route)
                    }
                }
                return res
            },
            async confirmRole(form) {
                this.$refs[form].validate(valid=>{
                    if(valid){
                        this.dialogVisible = false
                        if(this.dialogType === 'edit'){
                            updatePermission(this.form)
                                .then(async ()=>{
                                    this.$message.success('修改权限成功');
                                    this.getRoutes();
                                    this.getRoles();
                                })
                        }else{
                            addPermission(this.form)
                                .then(async()=>{
                                    this.$message.success('添加权限成功');
                                    this.getRoutes();
                                    this.getRoles();
                                })
                        }
                    }
                });
            },
            // reference: src/view/layout/components/Sidebar/SidebarItem.vue
            onlyOneShowingChild(children = [], parent) {
                let onlyOneChild = null
                const showingChildren = children.filter(item => !item.hidden)

                // When there is only one child route, the child route is displayed by default
                if (showingChildren.length === 1) {
                    onlyOneChild = showingChildren[0]
                    onlyOneChild.path = path.resolve(parent.path, onlyOneChild.path)
                    return onlyOneChild
                }

                // Show parent if there are no child route to display
                if (showingChildren.length === 0) {
                    onlyOneChild = { ... parent, path: '', noShowingChildren: true }
                    return onlyOneChild
                }

                return false
            }
        }
    }
</script>

<style lang="scss" scoped>
    .app-container {
        .roles-table {
            margin-top: 30px;
        }
        .permission-tree {
            margin-bottom: 30px;
        }
    }
</style>
