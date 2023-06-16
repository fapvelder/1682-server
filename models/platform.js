import mongoose from 'mongoose'
const Schema = mongoose.Schema
const platformSchema = new mongoose.Schema({
  name: { type: String, required: true },
})
export const PlatformModel = mongoose.model('Platform', platformSchema)
