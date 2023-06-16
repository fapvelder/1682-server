import mongoose from 'mongoose'
const Schema = mongoose.Schema
const roleSchema = new mongoose.Schema({
  roleName: { type: String, required: true },
})
export const RoleModel = mongoose.model('Role', roleSchema)
